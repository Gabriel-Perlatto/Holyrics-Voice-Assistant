import { BadRequestException } from '@nestjs/common';
import { RealtimeEventType } from '../../realtime/enums/realtime-event-type.enum';
import type { RealtimeService } from '../../realtime/services/realtime.service';
import type { SettingsRepository } from '../repositories/settings.repository';
import { ModelPathService } from './model-path.service';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  const currentSettings = {
    holyricsConnectionMode: 'local' as const,
    holyricsHost: '',
    holyricsPort: null,
    holyricsApiKey: null,
    holyricsApiToken: null,
    language: 'pt-BR',
    microphone: null,
    voskModelPath: null,
    speechAutoStart: false,
    voiceActivationWord: 'sistema' as string | null,
    updatedAt: '2026-06-20T00:00:00.000Z',
  };

  const createRepository = (): jest.Mocked<SettingsRepository> =>
    ({
      find: jest.fn(() => currentSettings),
      save: jest.fn((settings) => ({
        ...settings,
        updatedAt: '2026-06-20T01:00:00.000Z',
      })),
      onModuleDestroy: jest.fn(),
    }) as unknown as jest.Mocked<SettingsRepository>;

  const createRealtimeService = (): jest.Mocked<RealtimeService> =>
    ({
      emit: jest.fn(),
    }) as unknown as jest.Mocked<RealtimeService>;

  const createService = (
    repository = createRepository(),
    realtimeService = createRealtimeService(),
  ) => ({
    repository,
    realtimeService,
    service: new SettingsService(
      repository,
      realtimeService,
      new ModelPathService(),
    ),
  });

  it('retorna as configurações atuais', () => {
    const { service } = createService();

    expect(service.getSettings()).toEqual(currentSettings);
    expect(service.getPublicSettings()).toEqual({
      holyricsHost: '',
      holyricsPort: null,
      holyricsConnectionMode: 'local',
      holyricsApiKeyConfigured: false,
      holyricsApiTokenConfigured: false,
      language: 'pt-BR',
      microphone: null,
      voskModelPath: null,
      speechAutoStart: false,
      voiceActivationWord: 'sistema',
      updatedAt: '2026-06-20T00:00:00.000Z',
      voskModelPathStatus: {
        configured: false,
        exists: false,
        isDirectory: false,
        valid: false,
        code: 'not-configured',
        message: 'Nenhum diretório de modelo configurado.',
      },
    });
  });

  it('normaliza e salva configurações válidas', () => {
    const { repository, realtimeService, service } = createService();

    const result = service.updateSettings({
      holyricsHost: ' 192.168.1.20 ',
      holyricsPort: 8091,
      holyricsApiKey: ' web-api-key ',
      holyricsApiToken: ' secret-token ',
      language: 'pt-BR',
      microphone: ' Microfone USB ',
      voskModelPath: ' /modelos/vosk-pt ',
      speechAutoStart: true,
      voiceActivationWord: ' Assistente ',
    });

    expect(repository.save).toHaveBeenCalledWith({
      holyricsConnectionMode: 'local',
      holyricsHost: '192.168.1.20',
      holyricsPort: 8091,
      holyricsApiKey: 'web-api-key',
      holyricsApiToken: 'secret-token',
      language: 'pt-BR',
      microphone: 'Microfone USB',
      voskModelPath: '/modelos/vosk-pt',
      speechAutoStart: true,
      voiceActivationWord: 'Assistente',
    });
    expect(result.holyricsHost).toBe('192.168.1.20');
    expect(result.holyricsApiTokenConfigured).toBe(true);
    expect(result.voskModelPathStatus).toMatchObject({
      configured: true,
      valid: false,
      code: 'not-found',
    });
    expect(realtimeService.emit).toHaveBeenCalledWith(
      RealtimeEventType.SETTINGS_UPDATED,
      {
        holyricsConfigured: true,
        holyricsConnectionMode: 'local',
        holyricsApiKeyConfigured: true,
        holyricsApiTokenConfigured: true,
        language: 'pt-BR',
        microphoneConfigured: true,
        voskModelConfigured: true,
        speechAutoStart: true,
        voiceActivationWord: 'Assistente',
        updatedAt: '2026-06-20T01:00:00.000Z',
      },
    );
    expect(realtimeService.emit.mock.calls[0][1]).not.toHaveProperty(
      'holyricsApiToken',
    );
    expect(realtimeService.emit.mock.calls[0][1]).not.toHaveProperty(
      'holyricsApiKey',
    );
  });

  it('aceita campos opcionais vazios', () => {
    const { repository, service } = createService();

    service.updateSettings({
      holyricsHost: '',
      holyricsPort: '',
      holyricsApiToken: undefined,
      language: 'pt-BR',
      microphone: '',
      voskModelPath: null,
      speechAutoStart: false,
    });

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        holyricsHost: '',
        holyricsPort: null,
        holyricsApiKey: null,
        holyricsApiToken: null,
        microphone: null,
        voskModelPath: null,
      }),
    );
  });

  it.each([
    [
      'host com protocolo',
      {
        holyricsHost: 'http://192.168.1.20',
        holyricsPort: 8091,
        holyricsApiToken: undefined,
        language: 'pt-BR',
        microphone: null,
        voskModelPath: null,
      },
    ],
    [
      'porta fora da faixa',
      {
        holyricsHost: '192.168.1.20',
        holyricsPort: 70_000,
        holyricsApiToken: undefined,
        language: 'pt-BR',
        microphone: null,
        voskModelPath: null,
      },
    ],
    [
      'idioma inválido',
      {
        holyricsHost: '192.168.1.20',
        holyricsPort: 8091,
        holyricsApiToken: undefined,
        language: 'português',
        microphone: null,
        voskModelPath: null,
      },
    ],
  ])('rejeita %s', (_description, input) => {
    const { repository, service } = createService();

    expect(() => service.updateSettings(input)).toThrow(
      BadRequestException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('preserva o token quando o campo não é enviado', () => {
    const repository = createRepository();
    repository.find.mockReturnValue({
      ...currentSettings,
      holyricsApiToken: 'saved-token',
      holyricsApiKey: 'saved-key',
    });
    const { service } = createService(repository);

    service.updateSettings({
      holyricsHost: '192.168.1.20',
      holyricsPort: 8091,
      language: 'pt-BR',
      microphone: null,
      voskModelPath: null,
    });

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        holyricsApiToken: 'saved-token',
        holyricsApiKey: 'saved-key',
      }),
    );
  });

  it('preserva o modo de conexão atual quando o campo não é enviado', () => {
    const repository = createRepository();
    repository.find.mockReturnValue({
      ...currentSettings,
      holyricsConnectionMode: 'web',
    });
    const { service } = createService(repository);

    service.updateSettings({
      holyricsHost: '',
      holyricsPort: null,
      language: 'pt-BR',
      microphone: null,
      voskModelPath: null,
    });

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        holyricsConnectionMode: 'web',
      }),
    );
  });

  it('preserva a palavra de ativação atual quando o campo não é enviado', () => {
    const repository = createRepository();
    repository.find.mockReturnValue({
      ...currentSettings,
      voiceActivationWord: 'computador',
    });
    const { service } = createService(repository);

    service.updateSettings({
      holyricsHost: '',
      holyricsPort: null,
      language: 'pt-BR',
      microphone: null,
      voskModelPath: null,
    });

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        voiceActivationWord: 'computador',
      }),
    );
  });

  it('desativa a palavra de ativação quando recebe texto vazio', () => {
    const { repository, service } = createService();

    service.updateSettings({
      holyricsHost: '',
      holyricsPort: null,
      language: 'pt-BR',
      microphone: null,
      voskModelPath: null,
      voiceActivationWord: '',
    });

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        voiceActivationWord: null,
      }),
    );
  });

  it('rejeita palavra de ativação maior que 50 caracteres', () => {
    const { service } = createService();

    expect(() =>
      service.updateSettings({
        holyricsHost: '',
        holyricsPort: null,
        language: 'pt-BR',
        microphone: null,
        voskModelPath: null,
        voiceActivationWord: 'a'.repeat(51),
      }),
    ).toThrow(BadRequestException);
  });

  it('remove o token quando recebe null', () => {
    const { repository, service } = createService();

    service.updateSettings({
      holyricsHost: '192.168.1.20',
      holyricsPort: 8091,
      holyricsApiToken: null,
      language: 'pt-BR',
      microphone: null,
      voskModelPath: null,
    });

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        holyricsApiToken: null,
      }),
    );
  });

  it('remove a API key quando recebe null', () => {
    const { repository, service } = createService();

    service.updateSettings({
      holyricsHost: '192.168.1.20',
      holyricsPort: 8091,
      holyricsApiKey: null,
      language: 'pt-BR',
      microphone: null,
      voskModelPath: null,
    });

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        holyricsApiKey: null,
      }),
    );
  });

  it('rejeita modo de conexão desconhecido', () => {
    const { service } = createService();

    expect(() =>
      service.updateSettings({
        holyricsConnectionMode: 'remote',
        holyricsHost: '',
        holyricsPort: null,
        language: 'pt-BR',
        microphone: null,
        voskModelPath: null,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejeita token vazio quando enviado explicitamente', () => {
    const { service } = createService();

    expect(() =>
      service.updateSettings({
        holyricsHost: '192.168.1.20',
        holyricsPort: 8091,
        holyricsApiToken: '   ',
        language: 'pt-BR',
        microphone: null,
        voskModelPath: null,
      }),
    ).toThrow(BadRequestException);
  });
});
