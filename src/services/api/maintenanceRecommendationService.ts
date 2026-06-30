import { apiClientCore as apiClient } from './apiClient';
import type {
  RecommendationsForAssetsRequest,
  RecommendationsForAssetsResponse,
} from '@/types/maintenance/MaintenanceRecommendation';

const maintenanceRecommendationService = {
  getRecommendationsForAssets: async (
    body: RecommendationsForAssetsRequest
  ): Promise<RecommendationsForAssetsResponse> => {
    const response = await apiClient.post<RecommendationsForAssetsResponse>(
      '/maintenance-recommendations/for-assets',
      body
    );
    return response.data;
  },
};

export default maintenanceRecommendationService;
