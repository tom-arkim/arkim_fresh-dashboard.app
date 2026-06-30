import CompanySignupDto from '../../types/company/CompanySignupDto';
import CompanySettings from '../../types/company/CompanySettings';
import CompanyListItem from '../../types/company/CompanyListItem';
import CompanySetupDto from '../../types/company/CompanySetupDto';
import { apiClientCore as apiClient } from './apiClient';

/**
 * Service for company-related API operations
 */
const companyService = {
  /**
   * Register a new company with an admin user
   */
  signup: async (signupData: CompanySignupDto): Promise<void> => {
    await apiClient.post(
      '/company/signup',
      signupData
    );
  },

  getList: async (permission: string): Promise<CompanyListItem[]> => {
    const response = await apiClient.get<CompanyListItem[]>('/company/list', {
      params: {
        permission,
      },
    });
    return response.data;
  },

  setup: async (setupData: CompanySetupDto): Promise<void> => {
    await apiClient.post(
      '/company/setup',
      setupData
    );
  },

  getSettings: async (): Promise<CompanySettings> => {
    const response = await apiClient.get<CompanySettings>('/company');
    return response.data;
  },

  /**
   * Update company settings
   */
  updateSettings: async (
    settings: CompanySettings
  ): Promise<void> => {
    await apiClient.put('/company', settings);
  },
};

export default companyService;
