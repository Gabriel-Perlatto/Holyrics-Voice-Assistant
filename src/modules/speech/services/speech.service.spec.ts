import { ServiceUnavailableException } from '@nestjs/common';
import { RealtimeEventType } from '../../realtime/enums/realtime-event-type.enum';
import type { RealtimeService } from '../../realtime/services/realtime.service';
import type { SettingsService } from '../../settings/services/settings.service';
import { SpeechState } from '../enums/speech-state.enum';
import type { SpeechProvider } from '../interfaces/speech-provider.interface';
import type {
  SpeechProviderHandlers,
  SpeechProviderStatus,
} from '../interfaces/speech.interface';
import { SpeechService } from './speech.service';

describe('SpeechService', () => {
  const readyStatus: SpeechProviderStatus = {
    provider: 'vosk',
    state: SpeechState.READY,
    initialized: true,
    capturing: false,
    modelLoaded: true,
    modelPath: '/models/pt-BR/model',
    modelName: 'model',
    microphone: 'default',
    errorCode: null,
    message: 'Pronto.',
  };

  const createProvider = (): jest.Mocked<SpeechProvider> =>
    ({
      initialize: jest.fn(async () => readyStatus),
      start: jest.fn(async () => ({
        ...readyStatus,
        state: SpeechState.LISTENING,
        capturing: true,
      })),
      stop: jest.fn(async () => ({
        ...readyStatus,
        state: SpeechState.STOPPED,
      })),
      getStatus: jest.fn(() => readyStatus),
      listMicrophones: jest.fn(async () => [
        { id: 'default', name: 'Padrão', isDefault: true },
      ]),
      dispose: jest.fn(async () => undefined),
    }) as unknown as jest.Mocked<SpeechProvider>;

  const createSettingsService = (): jest.Mocked<SettingsService> =>
    ({
      getSettings: jest.fn(() => ({
        holyricsHost: '',
        holyricsPort: null,
        holyricsApiToken: null,
        language: 'pt-BR',
        microphone: 'default',
        voskModelPath: '/models/pt-BR/model',
        speechAutoStart: false,
        updatedAt: '2026-06-20T00:00:00.000Z',
      })),
    }) as unknown as jest.Mocked<SettingsService>;

  const createRealtimeService = (): jest.Mocked<RealtimeService> =>
    ({
      emit: jest.fn(),
      emitSystemError: jest.fn(),
    }) as unknown as jest.Mocked<RealtimeService>;

  const createService = () => {
    const provider = createProvider();
    const settings = createSettingsService();
    const realtime = createRealtimeService();
    const service = new SpeechService(provider, settings, realtime);

    return { provider, settings, realtime, service };
  };

  it('inicializa o provider com as configurações persistidas', async () => {
    const { provider, service } = createService();

    await service.initialize();

    expect(provider.initialize).toHaveBeenCalledWith(
      {
        modelPath: '/models/pt-BR/model',
        microphone: 'default',
        language: 'pt-BR',
        sampleRate: 16_000,
      },
      expect.objectContaining({
        onTranscription: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
  });

  it('rejeita inicialização sem modelo configurado', async () => {
    const { provider, settings, realtime, service } = createService();
    settings.getSettings.mockReturnValue({
      ...settings.getSettings(),
      voskModelPath: null,
    });

    await expect(service.initialize()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(provider.initialize).not.toHaveBeenCalled();
    expect(realtime.emitSystemError).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'speech' }),
    );
  });

  it('inicia captura e emite SPEECH_STARTED', async () => {
    const { provider, realtime, service } = createService();

    const status = await service.start();

    expect(provider.start).toHaveBeenCalled();
    expect(status.capturing).toBe(false);
    expect(realtime.emit).toHaveBeenCalledWith(
      RealtimeEventType.SPEECH_STARTED,
      {
        provider: 'vosk',
        model: 'model',
        microphone: 'default',
      },
    );
  });

  it('para captura ativa e emite SPEECH_STOPPED', async () => {
    const { provider, realtime, service } = createService();
    provider.getStatus.mockReturnValue({
      ...readyStatus,
      state: SpeechState.LISTENING,
      capturing: true,
    });

    await service.stop();

    expect(provider.stop).toHaveBeenCalled();
    expect(realtime.emit).toHaveBeenCalledWith(
      RealtimeEventType.SPEECH_STOPPED,
      { provider: 'vosk', reason: 'requested' },
    );
  });

  it('repassa transcrições sem interpretar o texto', async () => {
    const { provider, realtime, service } = createService();
    let handlers: SpeechProviderHandlers | undefined;
    provider.initialize.mockImplementation(async (_config, value) => {
      handlers = value;
      return readyStatus;
    });
    await service.initialize();

    handlers?.onTranscription({
      text: 'João capítulo três',
      final: true,
      provider: 'vosk',
      receivedAt: '2026-06-20T00:00:00.000Z',
    });

    expect(realtime.emit).toHaveBeenCalledWith(
      RealtimeEventType.TRANSCRIPTION_RECEIVED,
      {
        text: 'João capítulo três',
        final: true,
        provider: 'vosk',
        receivedAt: '2026-06-20T00:00:00.000Z',
      },
    );
    expect(service.getStatus().lastTranscription?.text).toBe(
      'João capítulo três',
    );
    expect(realtime.emit).not.toHaveBeenCalledWith(
      RealtimeEventType.COMMAND_IDENTIFIED,
      expect.anything(),
    );
  });

  it('respeita inicialização automática desativada', async () => {
    const { provider, service } = createService();

    await service.onApplicationBootstrap();

    expect(provider.start).not.toHaveBeenCalled();
  });

  it('inicia automaticamente quando a preferência está ativa', async () => {
    const { provider, settings, service } = createService();
    settings.getSettings.mockReturnValue({
      ...settings.getSettings(),
      speechAutoStart: true,
    });

    await service.onApplicationBootstrap();

    expect(provider.initialize).toHaveBeenCalled();
    expect(provider.start).toHaveBeenCalled();
  });

  it('explica por que permanece parado sem configuração', () => {
    const { provider, settings, service } = createService();
    provider.getStatus.mockReturnValue({
      ...readyStatus,
      state: SpeechState.IDLE,
      initialized: false,
      modelLoaded: false,
    });
    settings.getSettings.mockReturnValue({
      ...settings.getSettings(),
      microphone: null,
      voskModelPath: null,
    });

    expect(service.getStatus()).toMatchObject({
      state: SpeechState.IDLE,
      initialized: false,
      errorCode: 'MODEL_NOT_CONFIGURED',
      message:
        'Configure o caminho do modelo Vosk para habilitar a transcrição.',
    });
  });
});
