import { RealtimeEventType } from '../enums/realtime-event-type.enum';

export interface HolyricsConnectedPayload {
  connected: true;
  authenticated: true;
  version: string;
  checkedAt: string;
}

export interface HolyricsDisconnectedPayload {
  connected: false;
  authenticated: false;
  reason: string;
  checkedAt: string;
}

export interface BibleChangedPayload {
  book: {
    id: string;
    name: string;
  };
  chapter: number;
  verse: number;
  version: string;
  source: 'local-fallback';
  delivery: 'local-only';
  deliveredToHolyrics: false;
}

export interface SettingsUpdatedPayload {
  holyricsConfigured: boolean;
  holyricsApiTokenConfigured: boolean;
  language: string;
  microphoneConfigured: boolean;
  voskModelConfigured: boolean;
  updatedAt: string;
}

export interface SystemErrorPayload {
  source: string;
  message: string;
}

export interface RealtimeEventPayloadMap {
  [RealtimeEventType.HOLYRICS_CONNECTED]: HolyricsConnectedPayload;
  [RealtimeEventType.HOLYRICS_DISCONNECTED]: HolyricsDisconnectedPayload;
  [RealtimeEventType.BIBLE_CHANGED]: BibleChangedPayload;
  [RealtimeEventType.SETTINGS_UPDATED]: SettingsUpdatedPayload;
  [RealtimeEventType.SYSTEM_ERROR]: SystemErrorPayload;
  [RealtimeEventType.TRANSCRIPTION_RECEIVED]: Record<string, never>;
  [RealtimeEventType.COMMAND_IDENTIFIED]: Record<string, never>;
  [RealtimeEventType.COMMAND_EXECUTED]: Record<string, never>;
  [RealtimeEventType.SPEECH_STARTED]: Record<string, never>;
  [RealtimeEventType.SPEECH_STOPPED]: Record<string, never>;
  [RealtimeEventType.SONG_CHANGED]: Record<string, never>;
}

export interface RealtimeEvent<
  T extends RealtimeEventType = RealtimeEventType,
> {
  type: T;
  payload: RealtimeEventPayloadMap[T];
  occurredAt: string;
}
