export type HolyricsConnectionErrorCode =
  | 'CONNECTION_REFUSED'
  | 'HOST_NOT_FOUND'
  | 'TIMEOUT'
  | 'UNAVAILABLE';

export class HolyricsConnectionError extends Error {
  constructor(
    public readonly code: HolyricsConnectionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = HolyricsConnectionError.name;
  }
}
