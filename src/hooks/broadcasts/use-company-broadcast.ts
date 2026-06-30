import { useBroadcast } from "../use-broadcast";

export type CompanyEvent =
    | { type: 'COMPANY_UPDATED'; };

export function useCompanyBroadcast(onMessage?: (event: CompanyEvent) => void) {
    const { emit } = useBroadcast<CompanyEvent>('company', onMessage);

    // emit that a company has been updated with the company id
    const companyUpdated = () => {
        emit({ type: 'COMPANY_UPDATED' });
    }

    return { companyUpdated };
}