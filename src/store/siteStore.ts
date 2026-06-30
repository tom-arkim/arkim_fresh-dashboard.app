// store/siteStore.ts
import { applyUserSettings } from '@/lib/dayjs-utils';
import SiteDetails from '@/types/sites/SiteDetails';
import { create } from 'zustand';

interface SiteState {
  currentSite: SiteDetails | null;
  userSites: SiteDetails[];
  isLoading: boolean;

  setUserSites: (sites: SiteDetails[]) => void;

  setCurrentSite: (site: SiteDetails) => void;

  getUseMetricSystem: () => boolean;

  setIsLoading: (isLoading: boolean) => void;

  clearSite: () => void;
}

const useSiteStore = create<SiteState>((set, get) => ({
  siteOverview: null,
  currentSite: null,
  userSites: [],
  isLoading: false,

  clearSite: () => set({ currentSite: null }),

  setUserSites: (sites: SiteDetails[]) => set({ userSites: sites }),

  setCurrentSite: (site) => {
    applyUserSettings({
      dateFormat: site?.configuration?.dateFormat,
      timeFormat: site?.configuration?.timeFormat,
    });
    set({ currentSite: site });
  },

  getUseMetricSystem: () => {
    const site = get().currentSite;
    return site?.useMetricSystem ?? false;
  },

  setIsLoading: (isLoading: boolean) => set({ isLoading }),
}));

export default useSiteStore;
