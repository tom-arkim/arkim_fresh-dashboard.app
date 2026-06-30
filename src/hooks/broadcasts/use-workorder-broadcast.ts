'use client';

import { WorkOrderStatus } from "@/config/enum";
import { useBroadcast } from "../use-broadcast";


export type WorkOrderEvent =
    | { type: 'WORK_ORDER_CLAIMED'; workOrderId: string; siteId: string; status: WorkOrderStatus; }
    | { type: 'WORK_ORDER_LIST_REFRESH'; siteId: string; assetId?: string; };

export function useWorkOrderBroadcast(onMessage?: (event: WorkOrderEvent) => void) {

    const { emit } = useBroadcast<WorkOrderEvent>('work-orders', onMessage);

    const requestWorkOrderListRefresh = (siteId: string) => {
        emit({ type: 'WORK_ORDER_LIST_REFRESH', siteId });
    }

    return { requestWorkOrderListRefresh };
}