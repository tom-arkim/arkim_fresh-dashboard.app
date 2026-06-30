import { getApiConfig } from '@/config/environmentVariablesService';
import { ApiError } from '@/lib/api-error';
import { clearOidcStorage } from '@/storage/oidcStorage';
import oidcAuthService from '@/services/auth/oidcAuthService';
import { STORAGE_KEYS, API_ENDPOINTS } from '@/config/constant';
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import authService from './authService';
import { logger } from '@/lib/logger';
import { DEMO_MODE, demoAdapter } from '@/lib/demoData'; // DEV-ONLY DEMO — remove before shipping

const apiConfig = getApiConfig();

const isLocal = import.meta.env.DEV;

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const createClient = (baseUrl?: string): AxiosInstance => {
  const client = axios.create({
    baseURL: isLocal ? baseUrl : `${window.location.origin}${baseUrl}`,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });

  client.interceptors.request.use(
    (config) => {
      // Don't send requests during signOut to avoid race conditions
      // But allow the logout request itself
      if (
        oidcAuthService.isSigningOut() &&
        config.url !== API_ENDPOINTS.AUTH.LOGOUT
      ) {
        logger.info('[API] Request blocked during signOut:', config.url);
        const controller = new AbortController();
        controller.abort();
        config.signal = controller.signal;
        return config;
      }

      const token = oidcAuthService.getAuthToken();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }

      const selectedCompanyId = localStorage.getItem(
        STORAGE_KEYS.SELECTED_COMPANY_ID
      );
      if (selectedCompanyId) {
        config.headers['X-Arkim-CompanyId'] = selectedCompanyId;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      if (error.code === 'ERR_CANCELED') {
        return Promise.reject(error);
      }

      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      if (error.response) {
        const { status, data } = error.response;

        if (status === 401 && !originalRequest._retry) {
          if (oidcAuthService.isSigningOut()) {
            logger.info(
              '[API] 401 ignored during signOut:',
              originalRequest.url
            );
            return Promise.reject(error);
          }
          logger.info(
            '[API] 401 received, attempting refresh:',
            originalRequest.url
          );

          if (isRefreshing) {
            return new Promise((resolve) => {
              addRefreshSubscriber((token: string) => {
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                resolve(client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const response = await authService.refreshTokens();
            const newToken = response.idToken;

            oidcAuthService.setAuthToken(newToken);
            onTokenRefreshed(newToken);

            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return client(originalRequest);
          } catch (refreshError) {
            oidcAuthService.clearAuthToken();
            clearOidcStorage();
            if (!oidcAuthService.isSigningOut()) {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }

        logger.error(
          `❌ HTTP Error ${status}:`,
          data?.detail || data?.message || 'Unknown error'
        );

        const customError = new ApiError(
          data?.detail || data?.message || `HTTP Error ${status}`,
          status,
          data,
          false
        );
        return Promise.reject(customError);
      } else if (error.request) {
        const networkError = new ApiError(
          'Network error - please check your connection',
          0,
          undefined,
          true
        );
        return Promise.reject(networkError);
      } else {
        logger.error('⚙️ Request setup error:', error.message);
        return Promise.reject(error);
      }
    }
  );

  // DEV-ONLY DEMO — serve mock data with no backend. Remove before shipping.
  if (DEMO_MODE) {
    client.defaults.adapter = demoAdapter;
  }

  return client;
};

export const apiClientCore = createClient(apiConfig.baseUrlCore);
export const apiClientMonitoring = createClient(apiConfig.baseUrlMonitoring);
export const apiClientMessaging = createClient(apiConfig.baseUrlMessaging);
export const apiClientOnboarding = createClient(apiConfig.baseUrlOnboarding);
