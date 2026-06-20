export interface HolyricsBibleProjectionInput {
  reference: string;
  version: string;
}

export type BibleProjectionDelivery =
  | 'holyrics'
  | 'local-only'
  | 'failed';

export interface HolyricsBibleProjectionResult {
  reference: string;
  version: string;
  delivery: BibleProjectionDelivery;
  deliveredToHolyrics: boolean;
  message: string;
  error: string | null;
  attemptedAt: string;
}
