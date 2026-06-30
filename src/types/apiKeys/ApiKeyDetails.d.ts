import ApiKeyBase from './ApiKeyBase';

export default interface ApiKeyDetails extends ApiKeyBase {
  secret: string;
}
