export interface HolyricsConnectionTarget {
  host: string;
  port: number;
}

export interface HolyricsProviderConnectionResult {
  url: string;
  statusCode: number;
  latencyMs: number;
}

export interface HolyricsConnectionResult
  extends HolyricsProviderConnectionResult {
  connected: true;
  message: string;
  checkedAt: string;
}
