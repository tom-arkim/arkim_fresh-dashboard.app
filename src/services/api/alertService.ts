import { apiClientCore } from '@/services/api/apiClient';
import { AssetsAlerts } from '@/types/dashboard/dashboard';


const alertService = {
  list: async (siteId: string): Promise<AssetsAlerts> => {
    const response = await apiClientCore.get<AssetsAlerts>(
      `/alert/alerts?siteId=${siteId}`
    );
    return response.data;
  },

  acknowledge: async (alertId: string): Promise<void> => {
    await apiClientCore.patch(
      `/alert/alerts/acknowledge/${alertId}`
    );
  },
};

export default alertService;
