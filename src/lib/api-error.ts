export class ApiError extends Error {
  public status?: number; // Optional, undefined for network errors
  public data?: unknown;
  public isNetworkError: boolean;

  constructor(
    message: string,
    status: number,
    data: unknown,
    isNetworkError = false
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.isNetworkError = isNetworkError;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}
