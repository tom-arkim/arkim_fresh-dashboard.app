import { useBroadcast } from "../use-broadcast";

export type CompanyDetailEvent =
    | { type: 'COMPANY_DETAIL_REFRESHED'; };

export function useCompanyDetailBroadcast(onMessage?: (event: CompanyDetailEvent) => void) {
    const { emit } = useBroadcast<CompanyDetailEvent>('company-detail', onMessage);

    // emit that the company detail has been refreshed with the company detail details
    const requestCompanyDetailRefresh = () => {
        emit({ type: 'COMPANY_DETAIL_REFRESHED' });
    }

    return { requestCompanyDetailRefresh };
}