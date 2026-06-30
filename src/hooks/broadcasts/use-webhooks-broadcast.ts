import { useBroadcast } from "../use-broadcast";

export type WebHooksEvent =
    | { type: 'WEBHOOKS_REFRESHED'; };

export function useWebHooksBroadcast(onMessage?: (event: WebHooksEvent) => void) {
    const { emit } = useBroadcast<WebHooksEvent>('webhooks', onMessage);

    // emit that the webhooks list has been refreshed with the webhooks details
    const requestWebHooksRefresh = () => {
        emit({ type: 'WEBHOOKS_REFRESHED' });
    }

    return { requestWebHooksRefresh };
}