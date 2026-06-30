import axios from 'axios';
import { apiClientCore as apiClient } from './apiClient';
import UserContextDetails from '../../types/user/UserContextDetails';
import { getApiConfig } from '@/config/environmentVariablesService';
import { API_ENDPOINTS } from '@/config/constant';

const apiConfig = getApiConfig();
const baseUrl = apiConfig.baseUrlCore;

const authService = {
  exchangeTokens: async (
    idToken: string,
    refreshToken: string
  ): Promise<void> => {
    await axios.post(
      `${baseUrl}${API_ENDPOINTS.AUTH.SIGNIN}`,
      { refresh_token: refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        withCredentials: true,
      }
    );
  },

  refreshTokens: async (): Promise<{ idToken: string }> => {
    const response = await axios.post<{ idToken: string }>(
      `${baseUrl}${API_ENDPOINTS.AUTH.REFRESH}`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      }
    );
    return response.data;
  },

  getContext: async (): Promise<UserContextDetails> => {
    const response = await apiClient.get<UserContextDetails>(API_ENDPOINTS.AUTH.CONTEXT);
    return response.data;
  },

  signOut: async (): Promise<void> => {
    await axios.post(
      `${baseUrl}${API_ENDPOINTS.AUTH.LOGOUT}`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      }
    );
  },
};

export default authService;
