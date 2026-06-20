import type { SpeechMicrophone } from './speech.interface';

export interface AudioCaptureHandlers {
  onAudio(chunk: Buffer): void;
  onFailure(message: string): void;
}

export interface AudioCapture {
  listMicrophones(): Promise<SpeechMicrophone[]>;
  start(
    microphone: string,
    sampleRate: number,
    handlers: AudioCaptureHandlers,
  ): Promise<void>;
  stop(): Promise<void>;
}
