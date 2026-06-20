export type HolyricsApiErrorCode =
  | 'AUTHENTICATION_FAILED'
  | 'CONNECTION_REFUSED'
  | 'HOST_NOT_FOUND'
  | 'INVALID_RESPONSE'
  | 'PERMISSION_DENIED'
  | 'TIMEOUT'
  | 'UNAVAILABLE';

export class HolyricsApiError extends Error {
  constructor(
    public readonly code: HolyricsApiErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = HolyricsApiError.name;
  }
}
