import { logger } from '@/lib/logger';
/**
 * Application configuration
 *
 * This file centralizes all configuration variables from environment variables
 */

export interface ApiConfig {
  baseUrlCore?: string;
  baseUrlMonitoring?: string;
  baseUrlMessaging?: string;
  baseUrlOnboarding?: string;
}

export interface AppConfig {
  appName: string;
  appVersion: string;
}

const getEnvironmentVariable = (variableName: string) => {
  const variable = import.meta.env[variableName];
  if (!variable) {
    const errorMessage = `Environment variable ${variableName} is not defined`;
    logger.error(errorMessage);
  }
  return variable;
};

// API configuration
export const getApiConfig = () => {
  return {
    baseUrlCore: getEnvironmentVariable('VITE_API_BASE_URL_CORE'),
    baseUrlMonitoring: getEnvironmentVariable(
      'VITE_API_BASE_URL_MONITORING'
    ),
    baseUrlMessaging: getEnvironmentVariable(
      'VITE_API_BASE_URL_MESSAGING'
    ),
    baseUrlOnboarding: getEnvironmentVariable(
      'VITE_API_BASE_URL_ONBOARDING'
    ),
  };
};

export const getAppConfig = () => {
  return {
    appName: getEnvironmentVariable('VITE_APP_NAME'),
    appVersion: getEnvironmentVariable('VITE_APP_VERSION'),
  };
};

export const getEnvironment = () => {
  return getEnvironmentVariable('VITE_ENVIRONMENT') || 'dev';
};
