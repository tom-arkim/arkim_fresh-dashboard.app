import { AssetDocumentList } from '@/types/equipment/AssetDetails';
import { apiClientOnboarding as apiClient } from './apiClient';

const onboardingService = {

    getDocumentsByAssetAndModelId: async (assetId: string, assetModelId: string, search?: string | null): Promise<AssetDocumentList> => {
        const response = await apiClient.get(
            `/documents?asset_id=${assetId}&asset_model_id=${assetModelId}&search=${search ?? ''}`,
        );
        return response.data;
    },
};

export default onboardingService;
