import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SpeechErrorCode } from '../enums/speech-error-code.enum';
import { SpeechState } from '../enums/speech-state.enum';
import type { AudioCapture } from '../interfaces/audio-capture.interface';
import type {
  VoskModel,
  VoskRecognizer,
  VoskRuntime,
  VoskRuntimeLoader,
} from '../interfaces/vosk-runtime.interface';
import type { SpeechProviderHandlers } from '../interfaces/speech.interface';
import { VoskSpeechProvider } from './vosk-speech.provider';

describe('VoskSpeechProvider', () => {
  let temporaryDirectory: string;
  let modelPath: string;
  let audioHandler: ((chunk: Buffer) => void) | undefined;
  let runtime: VoskRuntime;
  let recognizer: VoskRecognizer;
  let model: VoskModel;
  let audioCapture: jest.Mocked<AudioCapture>;
  let runtimeLoader: jest.Mocked<VoskRuntimeLoader>;
  let provider: VoskSpeechProvider;

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'hva-vosk-'));
    modelPath = join(temporaryDirectory, 'model');
    mkdirSync(modelPath);
    ['final.mdl', 'HCLr.fst', 'Gr.fst', 'mfcc.conf'].forEach((file) =>
      writeFileSync(join(modelPath, file), 'test'),
    );

    recognizer = {
      acceptWaveform: jest.fn(() => false),
      partialResult: jest.fn(() => ({ partial: 'texto parcial' })),
      result: jest.fn(() => ({ text: 'texto final' })),
      finalResult: jest.fn(() => ({})),
      free: jest.fn(),
    };
    model = { free: jest.fn() };
    runtime = {
      setLogLevel: jest.fn(),
      Model: jest.fn(() => model) as unknown as VoskRuntime['Model'],
      Recognizer: jest.fn(
        () => recognizer,
      ) as unknown as VoskRuntime['Recognizer'],
    };
    runtimeLoader = {
      load: jest.fn(() => runtime),
    };
    audioCapture = {
      listMicrophones: jest.fn(async () => [
        { id: 'default', name: 'Padrão', isDefault: true },
      ]),
      start: jest.fn(async (_microphone, _rate, handlers) => {
        audioHandler = handlers.onAudio;
      }),
      stop: jest.fn(async () => undefined),
    };
    provider = new VoskSpeechProvider(runtimeLoader, audioCapture);
  });

  afterEach(async () => {
    await provider.dispose();
    rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  const initialize = (
    handlers: SpeechProviderHandlers = {
      onTranscription: jest.fn(),
      onError: jest.fn(),
    },
  ) =>
    provider.initialize(
      {
        modelPath,
        microphone: 'default',
        language: 'pt-BR',
        sampleRate: 16_000,
      },
      handlers,
    );

  it('carrega modelo válido sem expor detalhes do runtime', async () => {
    const status = await initialize();

    expect(status.state).toBe(SpeechState.READY);
    expect(status.modelLoaded).toBe(true);
    expect(runtime.Model).toHaveBeenCalledWith(modelPath);
    expect(runtime.Recognizer).toHaveBeenCalledWith({
      model,
      sampleRate: 16_000,
    });
  });

  it('rejeita diretório sem estrutura de modelo Vosk', async () => {
    rmSync(join(modelPath, 'Gr.fst'));

    await expect(initialize()).rejects.toMatchObject({
      code: SpeechErrorCode.MODEL_INVALID,
    });
    expect(runtimeLoader.load).not.toHaveBeenCalled();
  });

  it('rejeita microfone que não está disponível', async () => {
    audioCapture.listMicrophones.mockResolvedValue([]);

    await expect(initialize()).rejects.toMatchObject({
      code: SpeechErrorCode.MICROPHONE_NOT_FOUND,
    });
  });

  it('inicia, transcreve parcial e para a captura', async () => {
    const handlers = {
      onTranscription: jest.fn(),
      onError: jest.fn(),
    };
    await initialize(handlers);
    const started = await provider.start();
    audioHandler?.(Buffer.from([0, 1, 2, 3]));
    const stopped = await provider.stop();

    expect(started.capturing).toBe(true);
    expect(handlers.onTranscription).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'texto parcial',
        final: false,
        provider: 'vosk',
      }),
    );
    expect(stopped.state).toBe(SpeechState.STOPPED);
    expect(audioCapture.stop).toHaveBeenCalled();
  });

  it('emite transcrição final quando o reconhecedor fecha uma frase', async () => {
    const handlers = {
      onTranscription: jest.fn(),
      onError: jest.fn(),
    };
    (recognizer.acceptWaveform as jest.Mock).mockReturnValue(true);
    await initialize(handlers);
    await provider.start();
    audioHandler?.(Buffer.from([0, 1, 2, 3]));

    expect(handlers.onTranscription).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'texto final',
        final: true,
      }),
    );
  });

  it('transforma falha do binding em erro controlado', async () => {
    runtimeLoader.load.mockImplementation(() => {
      throw new Error('biblioteca Vosk indisponível');
    });

    await expect(initialize()).rejects.toMatchObject({
      code: SpeechErrorCode.VOSK_UNAVAILABLE,
    });
    expect(provider.getStatus().state).toBe(SpeechState.ERROR);
  });
});
