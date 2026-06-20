import type {
  HolyricsApiRequestResult,
  HolyricsApiTarget,
} from './holyrics-api.interface';

export interface HolyricsProvider {
  request<T>(
    target: HolyricsApiTarget,
    action: string,
    input?: Record<string, unknown>,
  ): Promise<HolyricsApiRequestResult<T>>;
}

export const HOLYRICS_PROVIDER = Symbol('HOLYRICS_PROVIDER');
