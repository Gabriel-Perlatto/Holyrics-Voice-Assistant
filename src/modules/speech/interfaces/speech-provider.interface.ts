import type {
  SpeechConfiguration,
  SpeechMicrophone,
  SpeechProviderHandlers,
  SpeechProviderStatus,
} from './speech.interface';

export interface SpeechProvider {
  initialize(
    configuration: SpeechConfiguration,
    handlers: SpeechProviderHandlers,
  ): Promise<SpeechProviderStatus>;
  start(): Promise<SpeechProviderStatus>;
  stop(): Promise<SpeechProviderStatus>;
  getStatus(): SpeechProviderStatus;
  listMicrophones(): Promise<SpeechMicrophone[]>;
  dispose(): Promise<void>;
}

export const SPEECH_PROVIDER = Symbol('SPEECH_PROVIDER');
