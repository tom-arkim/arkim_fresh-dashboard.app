import { getEnvironment } from './environmentVariablesService';

export const ISSUE_CODE = {
  BELOW_TEMPERATURE: '1',
  ABOVE_TEMPERATURE: '2',
  TEMPERATURE_SENSOR_NOT_RESPONDING: '3',
  BELOW_HUMIDITY: '4',
  ABOVE_HUMIDITY: '5',
  HUMIDITY_SENSOR_NOT_RESPONDING: '6',
  BELOW_POWER: '7',
  ABOVE_POWER: '8',
  POWER_SENSOR_NOT_RESPONDING: '9',
};

export const STORAGE_KEYS = {
  THEME_MODE: 'theme-mode',
  SELECTED_COMPANY_ID: 'selectedCompanyId',
  OIDC_REDIRECT_URL: 'oidc_redirect_url',
  SESSION_ID: 'arkimSessionId',
  I18NEXT_LNG: 'i18nextLng',
  OIDC_PREFIX: 'oidc',
  ID_TOKEN: 'arkim_id_token',
};

export const API_ENDPOINTS = {
  AUTH: {
    SIGNIN: '/auth/signin',
    REFRESH: '/auth/refresh',
    CONTEXT: '/auth/context',
    LOGOUT: '/auth/logout',
  },
};

const getCognitoDomain = () => {
  const environment = getEnvironment();
  return `https://chat-shared-${environment}.auth.us-west-2.amazoncognito.com`;
};

export const OIDC_CONFIG = {
  get COGNITO_DOMAIN() {
    return getCognitoDomain();
  },
  PATHS: {
    CALLBACK: '/signin-oidc',
    LOGIN: '/login',
    DASHBOARD: '/dashboard',
  },
  SCOPES: 'openid profile email',
  SIGNOUT_FLAG_KEY: 'oidc:signout_in_progress',
};

export const MODULES = {
  DASHBOARD: {
    TAG: 'dashboard',
    ACTIONS: {},
  },
  MONITORING: {
    TAG: 'monitoring',
    ACTIONS: {},
  },
  EQUIPMENT: {
    TAG: 'equipment',
    ACTIONS: {
      READ: 'read',
      WRITE: 'write',
      DELETE: 'delete',
    },
  },
  MAINTENANCE: {
    TAG: 'maintenance',
    ACTIONS: {
      WRITE: 'write',
      DELETE: 'delete',
    },
  },
  MAINTENANCE_TASKS: {
    TAG: 'maintenanceTasks',
    ACTIONS: {
      WRITE: 'write',
      DELETE: 'delete',
    },
  },
  WORK_ORDERS: {
    TAG: 'workOrders',
    ACTIONS: {},
  },
  READINGS: {
    TAG: 'readings',
    ACTIONS: {},
  },
  GENERAL: {
    TAG: 'general',
    ACTIONS: {},
  },
  COMPANY_DETAILS: {
    TAG: 'companyDetails',
    ACTIONS: {},
  },
  SITES: {
    TAG: 'site',
    ACTIONS: {},
  },
  USERS: {
    TAG: 'users',
    ACTIONS: {},
  },
  WEBHOOK: {
    TAG: 'webhooks',
    ACTIONS: {},
  },
  COMPANY_SETUP: {
    TAG: 'companySetup',
    ACTIONS: {},
  },
  COMPANY_SELECTION: {
    TAG: 'companySelection',
    ACTIONS: {},
  },
  NOTIFICATION: {
    TAG: 'notification',
    ACTIONS: {},
  },
} as const;

export const DEFAULT_PAST_DAYS = 1;