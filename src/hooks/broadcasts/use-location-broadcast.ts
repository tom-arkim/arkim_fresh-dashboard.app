'use client'

import { useBroadcast } from "../use-broadcast";

export type LocationEvent =
    | { type: 'LOCATION_UPDATED'; locationId: string }

export function useLocationBroadcast(onMessage?: (event: LocationEvent) => void) {

    const { emit } = useBroadcast<LocationEvent>('locations', onMessage);

    // emit that a location has been updated with the location details
    const locationUpdated = (locationId: string) => {
        emit({ type: 'LOCATION_UPDATED', locationId });
    }

    return { locationUpdated };
}