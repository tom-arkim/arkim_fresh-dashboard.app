import { apiClientCore as apiClient } from './apiClient';
import SiteBase from '../../types/sites/SiteBase';
import SiteDetails from '@/types/sites/SiteDetails';

const siteService = {
  list: async (search: string): Promise<SiteBase[]> => {
    const response = await apiClient.get<SiteBase[]>(
      `/sites/list?search=${search}`
    );
    return response.data;
  },

  listUserSites: async (): Promise<SiteDetails[]> => {
    const response = await apiClient.get<SiteDetails[]>(
      `/sites/list/context`
    );
    return response.data;
  },

  getById: async (id: string): Promise<SiteDetails> => {
    const response = await apiClient.get<SiteDetails>(
      `/sites?id=${encodeURIComponent(id)}`
    );
    return response.data;
  },

  create: async (site: SiteDetails): Promise<void> => {
    await apiClient.post(
      '/sites',
      site
    );
  },

  update: async (site: SiteDetails): Promise<void> => {
    await apiClient.patch(
      `/sites`,
      site
    );
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(
      `/sites?id=${encodeURIComponent(id)}`
    );
  },
};

export default siteService;
