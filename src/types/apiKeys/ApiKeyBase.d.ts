export default interface ApiKeyBase {
  accessKey: string;
  description?: string;
  createdAtUtc?: Date;
  isActive: boolean;
}
