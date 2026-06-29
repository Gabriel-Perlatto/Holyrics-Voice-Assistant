export type VoiceCommandMode = 'conservative' | 'fast';
export type HolyricsConnectionMode = 'local' | 'web';

export interface Settings {
  holyricsConnectionMode: HolyricsConnectionMode;
  holyricsHost: string;
  holyricsPort: number | null;
  holyricsApiKey: string | null;
  holyricsApiToken: string | null;
  language: string;
  microphone: string | null;
  voskModelPath: string | null;
  speechAutoStart: boolean;
  voiceCommandMode: VoiceCommandMode;
  updatedAt: string;
}

export type VoskModelPathStatusCode =
  | 'not-configured'
  | 'directory-found'
  | 'not-found'
  | 'not-directory'
  | 'unreadable';

export interface VoskModelPathStatus {
  configured: boolean;
  exists: boolean;
  isDirectory: boolean;
  valid: boolean;
  code: VoskModelPathStatusCode;
  message: string;
}

export interface PublicSettings
  extends Omit<Settings, 'holyricsApiKey' | 'holyricsApiToken'> {
  holyricsApiKeyConfigured: boolean;
  holyricsApiTokenConfigured: boolean;
  voskModelPathStatus: VoskModelPathStatus;
}
