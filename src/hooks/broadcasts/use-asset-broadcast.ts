import { useBroadcast } from "../use-broadcast";

export type AssetEvent =
    | { type: 'ASSET_CREATED_OR_UPDATED'; }
    | { type: 'ASSET_REFRESHED'; }

export function useAssetBroadcast(onMessage?: (event: AssetEvent) => void) {

    const { emit } = useBroadcast<AssetEvent>('assets', onMessage);

    // emit that a new asset has been created with the asset details
    const assetCreatedOrUpdated = () => {
        emit({ type: 'ASSET_CREATED_OR_UPDATED' });
    }

    // emit that asset list has been refreshed with the asset details  
    const requestAssetRefresh = () => {
        emit({ type: 'ASSET_REFRESHED' });
    }

    return { assetCreatedOrUpdated, requestAssetRefresh };
}