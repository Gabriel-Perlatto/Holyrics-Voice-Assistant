import type {
  HolyricsConnectionTarget,
  HolyricsProviderConnectionResult,
} from './holyrics-connection.interface';

export interface HolyricsProvider {
  testConnection(
    target: HolyricsConnectionTarget,
  ): Promise<HolyricsProviderConnectionResult>;
}

export const HOLYRICS_PROVIDER = Symbol('HOLYRICS_PROVIDER');
