import type { SpeechErrorCode } from '../enums/speech-error-code.enum';
import type { SpeechState } from '../enums/speech-state.enum';

export interface SpeechConfiguration {
  modelPath: string;
  microphone: string;
  language: string;
  sampleRate: number;
}

export interface SpeechTranscription {
  text: string;
  final: boolean;
  provider: 'vosk';
  receivedAt: string;
}

export interface SpeechMicrophone {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface SpeechProviderStatus {
  provider: 'vosk';
  state: SpeechState;
  initialized: boolean;
  capturing: boolean;
  modelLoaded: boolean;
  modelPath: string | null;
  modelName: string | null;
  microphone: string | null;
  errorCode: SpeechErrorCode | null;
  message: string;
}

export interface SpeechStatus extends SpeechProviderStatus {
  autoStart: boolean;
  lastTranscription: SpeechTranscription | null;
}

export interface SpeechProviderHandlers {
  onTranscription(transcription: SpeechTranscription): void;
  onError(error: SpeechProviderError): void;
}

export class SpeechProviderError extends Error {
  constructor(
    readonly code: SpeechErrorCode,
    message: string,
  ) {
    super(message);
    this.name = SpeechProviderError.name;
  }
}
