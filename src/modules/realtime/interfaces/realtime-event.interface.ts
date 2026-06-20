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
  speechAutoStart: boolean;
  updatedAt: string;
}

export interface SystemErrorPayload {
  source: string;
  message: string;
}

export interface SpeechStartedPayload {
  provider: 'vosk';
  model: string;
  microphone: string;
}

export interface SpeechStoppedPayload {
  provider: 'vosk';
  reason: 'requested' | 'capture-error' | 'shutdown';
}

export interface TranscriptionReceivedPayload {
  text: string;
  final: boolean;
  provider: 'vosk';
  receivedAt: string;
}

export interface RealtimeEventPayloadMap {
  [RealtimeEventType.HOLYRICS_CONNECTED]: HolyricsConnectedPayload;
  [RealtimeEventType.HOLYRICS_DISCONNECTED]: HolyricsDisconnectedPayload;
  [RealtimeEventType.BIBLE_CHANGED]: BibleChangedPayload;
  [RealtimeEventType.SETTINGS_UPDATED]: SettingsUpdatedPayload;
  [RealtimeEventType.SYSTEM_ERROR]: SystemErrorPayload;
  [RealtimeEventType.TRANSCRIPTION_RECEIVED]: TranscriptionReceivedPayload;
  [RealtimeEventType.COMMAND_IDENTIFIED]: Record<string, never>;
  [RealtimeEventType.COMMAND_EXECUTED]: Record<string, never>;
  [RealtimeEventType.SPEECH_STARTED]: SpeechStartedPayload;
  [RealtimeEventType.SPEECH_STOPPED]: SpeechStoppedPayload;
  [RealtimeEventType.SONG_CHANGED]: Record<string, never>;
}

export interface RealtimeEvent<
  T extends RealtimeEventType = RealtimeEventType,
> {
  type: T;
  payload: RealtimeEventPayloadMap[T];
  occurredAt: string;
}
