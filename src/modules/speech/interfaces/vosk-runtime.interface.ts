export interface VoskModel {
  free(): void;
}

export interface VoskRecognizer {
  acceptWaveform(buffer: Buffer): boolean;
  partialResult(): { partial?: string };
  result(): { text?: string };
  finalResult(): { text?: string };
  free(): void;
}

export interface VoskRuntime {
  setLogLevel(level: number): void;
  Model: new (modelPath: string) => VoskModel;
  Recognizer: new (options: {
    model: VoskModel;
    sampleRate: number;
  }) => VoskRecognizer;
}

export interface VoskRuntimeLoader {
  load(): VoskRuntime;
}

export const VOSK_RUNTIME_LOADER = Symbol('VOSK_RUNTIME_LOADER');
export const AUDIO_CAPTURE = Symbol('AUDIO_CAPTURE');
