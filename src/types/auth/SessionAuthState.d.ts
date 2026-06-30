import UserContextDetails from '../user/UserContextDetails';

export default interface SessionAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
  userContext: UserContextDetails | null;
}
