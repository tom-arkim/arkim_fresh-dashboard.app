import { TimeFrame } from '@/config/enum';
import { apiClientCore as apiClient } from '@/services/api/apiClient';
import {
  EnergyUsageOverview,
  EquipmentStatusOverview,
  OldSensorInsightsOverview,
} from '@/types/dashboard/dashboard';

const dashboardService = {
  getEuipmentStatus: async (
    locationId: string
  ): Promise<EquipmentStatusOverview> => {
    const response = await apiClient.get<EquipmentStatusOverview>(
      `/dashboard/assetstatus?locationId=${locationId}`
    );
    return response.data;
  },

  getEnergyUsageAnalysis: async (
    locationId: string,
    timeFrame: TimeFrame | string = 'hour'
  ): Promise<EnergyUsageOverview> => {
    const response = await apiClient.get<EnergyUsageOverview>(
      `/dashboard/energyusage?locationId=${locationId}&timeFrame=${timeFrame}`
    );
    return response.data;
  },

  getSensorInsight: async (
    locationId: string
  ): Promise<OldSensorInsightsOverview> => {
    const response = await apiClient.get<OldSensorInsightsOverview>(
      `/dashboard/sensorinsight?locationId=${locationId}`
    );
    return response.data;
  },
};

export default dashboardService;
