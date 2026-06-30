import { apiClientCore as apiClient } from './apiClient';
import AssetDetails from '../../types/equipment/AssetDetails';
import { EquipmentFormData } from '@/schemas/equipment.schema';

const equipmentService = {
  list: async (
    search: string,
    siteId: string,
    includeArchived?: boolean
  ): Promise<AssetDetails[]> => {
    const response = await apiClient.get<AssetDetails[]>(
      `/equipment/list`,
      {
        params: {
          search,
          siteId,
          includeArchived,
        },
      }
    );
    return response.data;
  },

  getById: async (id: string): Promise<AssetDetails> => {
    const response = await apiClient.get<AssetDetails>(
      `/equipment`,
      {
        params: {
          id,
        },
      }
    );
    return response.data;
  },

  create: async (asset: EquipmentFormData): Promise<void> => {
    await apiClient.post('/equipment', asset);
  },

  update: async (asset: EquipmentFormData): Promise<void> => {
    await apiClient.patch(`/equipment`, asset);
  },

  archive: async (id: string, archived: boolean): Promise<void> => {
    await apiClient.patch(
      `/equipment/archive?id=${encodeURIComponent(id)}&archived=${archived}`
    );
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/equipment?id=${encodeURIComponent(id)}`
    );
  },
};


export default equipmentService;
