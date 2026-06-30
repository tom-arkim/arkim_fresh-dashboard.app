import { useBroadcast } from "../use-broadcast";

export type SitesEvent =
    | { type: 'SITES_REFRESHED'; };

export function useSitesBroadcast(onMessage?: (event: SitesEvent) => void) {
    const { emit } = useBroadcast<SitesEvent>('sites', onMessage);

    // emit that the sites have been refreshed with the sites details
    const requestSitesRefresh = () => {
        emit({ type: 'SITES_REFRESHED' });
    }

    return { requestSitesRefresh };
}