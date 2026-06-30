import { useBroadcast } from "../use-broadcast";

export type MaintenanceScheduleEvent =
    | { type: 'MAINTENANCE_SCHEDULE_REFRESHED'; };

export function useMaintenanceScheduleBroadcast(onMessage?: (event: MaintenanceScheduleEvent) => void) {
    const { emit } = useBroadcast<MaintenanceScheduleEvent>('maintenance-schedule', onMessage);

    // emit that the maintenance schedule list has been refreshed with the maintenance schedule details
    const requestMaintenanceScheduleRefresh = () => {
        emit({ type: 'MAINTENANCE_SCHEDULE_REFRESHED' });
    }

    return { requestMaintenanceScheduleRefresh };
}