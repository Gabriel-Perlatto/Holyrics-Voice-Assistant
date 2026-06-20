export interface Settings {
  holyricsHost: string;
  holyricsPort: number | null;
  holyricsApiToken: string | null;
  language: string;
  microphone: string | null;
  voskModelPath: string | null;
  updatedAt: string;
}

export interface PublicSettings
  extends Omit<Settings, 'holyricsApiToken'> {
  holyricsApiTokenConfigured: boolean;
}
