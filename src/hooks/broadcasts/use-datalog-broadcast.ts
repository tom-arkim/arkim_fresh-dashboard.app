import { useBroadcast } from "../use-broadcast";

export type DataLogEvent =
    | { type: 'DATALOG_REFRESHED'; };

export function useDatalogBroadcast(onMessage?: (event: DataLogEvent) => void) {
    const { emit } = useBroadcast<DataLogEvent>('data-log', onMessage);

    // emit that the data log list has been refreshed with the data log details
    const requestDataLogRefresh = () => {
        emit({ type: 'DATALOG_REFRESHED' });
    }

    return { requestDataLogRefresh };
}