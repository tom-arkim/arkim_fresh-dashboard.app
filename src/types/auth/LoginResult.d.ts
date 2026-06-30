import UserContextDetails from '../user/UserContextDetails';

export default interface LoginResult {
  sessionId: string;
  context: UserContextDetails;
}
