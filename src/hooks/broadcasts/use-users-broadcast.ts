import { useBroadcast } from "../use-broadcast";

export type UsersEvent =
    | { type: 'USERS_REFRESHED'; };

export function useUsersBroadcast(onMessage?: (event: UsersEvent) => void) {
    const { emit } = useBroadcast<UsersEvent>('users', onMessage);

    // emit that the users have been refreshed with the users details
    const requestUsersRefresh = () => {
        emit({ type: 'USERS_REFRESHED' });
    }

    return { requestUsersRefresh };
}