import { useBroadcast } from "../use-broadcast";

export type MaintenanceTaskEvent =
    | { type: 'MAINTENANCE_TASK_REFRESHED'; };

export function useMaintenanceTaskBroadcast(onMessage?: (event: MaintenanceTaskEvent) => void) {
    const { emit } = useBroadcast<MaintenanceTaskEvent>('maintenance-task', onMessage);

    // emit that the maintenance task list has been refreshed with the maintenance schedule details
    const requestMaintenanceTaskRefresh = () => {
        emit({ type: 'MAINTENANCE_TASK_REFRESHED' });
    }

    return { requestMaintenanceTaskRefresh };
}