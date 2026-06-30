import { create } from 'zustand';
import userService from '@/services/api/userService';
import equipmentService from '@/services/api/equipmentService';
import AssetDetails from '@/types/equipment/AssetDetails';
import UserBase from '@/types/user/UserBase';

interface DataState {
    users: UserBase[];
    assets: AssetDetails[];
    userMap: Record<string, UserBase>;
    assetMap: Record<string, AssetDetails>;
    isLoadingUsers: boolean;
    isLoadingAssets: boolean;

    setUsers: (users: UserBase[]) => void;
    setAssets: (assets: AssetDetails[]) => void;

    fetchUsers: (hasPermission: boolean) => Promise<void>;
    fetchAssets: (siteId: string, hasPermission: boolean) => Promise<void>;

    clearData: () => void;
}

const useDataStore = create<DataState>((set) => ({
    users: [],
    assets: [],
    userMap: {},
    assetMap: {},
    isLoadingUsers: false,
    isLoadingAssets: false,

    setUsers: (users) => set({
        users,
        userMap: users.reduce((acc, user) => {
            acc[user.email] = user;
            return acc;
        }, {} as Record<string, UserBase>)
    }),

    setAssets: (assets) => set({
        assets,
        assetMap: assets.reduce((acc, asset) => {
            if (asset.id) acc[asset.id] = asset;
            return acc;
        }, {} as Record<string, AssetDetails>)
    }),

    fetchUsers: async (hasPermission: boolean) => {
        if (!hasPermission) {
            set({ users: [], isLoadingUsers: false });
            return;
        }

        set({ isLoadingUsers: true });
        try {
            const data = await userService.list('', false); // Fetch all active users
            set({
                users: data,
                userMap: data.reduce((acc, user) => {
                    acc[user.email] = user;
                    return acc;
                }, {} as Record<string, UserBase>)
            });
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            set({ isLoadingUsers: false });
        }
    },

    fetchAssets: async (siteId: string, hasPermission: boolean) => {
        if (!hasPermission || !siteId) {
            set({ assets: [], isLoadingAssets: false });
            return;
        }

        // Clear the previous facility's assets immediately so a site/company
        // switch can't show stale data while the new list loads (the dashboard
        // + Monitoring show the ArkimLoader during isLoadingAssets).
        set({ isLoadingAssets: true, assets: [], assetMap: {} });
        try {
            const data = await equipmentService.list('', siteId); // Fetch all assets for the site
            const sortedAssets = data.sort((a, b) => a.name.localeCompare(b.name));
            set({
                assets: sortedAssets,
                assetMap: sortedAssets.reduce((acc, asset) => {
                    if (asset.id) acc[asset.id] = asset;
                    return acc;
                }, {} as Record<string, AssetDetails>)
            });
        } catch (error) {
            console.error('Failed to fetch assets:', error);
        } finally {
            set({ isLoadingAssets: false });
        }
    },

    clearData: () => set({ users: [], assets: [], userMap: {}, assetMap: {} }),
}));

export default useDataStore;
