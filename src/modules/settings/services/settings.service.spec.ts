import { BadRequestException } from '@nestjs/common';
import type { SettingsRepository } from '../repositories/settings.repository';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  const currentSettings = {
    holyricsHost: '',
    holyricsPort: null,
    holyricsApiToken: null,
    language: 'pt-BR',
    microphone: null,
    voskModelPath: null,
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

  it('retorna as configurações atuais', () => {
    const repository = createRepository();
    const service = new SettingsService(repository);

    expect(service.getSettings()).toEqual(currentSettings);
    expect(service.getPublicSettings()).toEqual({
      holyricsHost: '',
      holyricsPort: null,
      holyricsApiTokenConfigured: false,
      language: 'pt-BR',
      microphone: null,
      voskModelPath: null,
      updatedAt: '2026-06-20T00:00:00.000Z',
    });
  });

  it('normaliza e salva configurações válidas', () => {
    const repository = createRepository();
    const service = new SettingsService(repository);

    const result = service.updateSettings({
      holyricsHost: ' 192.168.1.20 ',
      holyricsPort: 8091,
      holyricsApiToken: ' secret-token ',
      language: 'pt-BR',
      microphone: ' Microfone USB ',
      voskModelPath: ' /modelos/vosk-pt ',
    });

    expect(repository.save).toHaveBeenCalledWith({
      holyricsHost: '192.168.1.20',
      holyricsPort: 8091,
      holyricsApiToken: 'secret-token',
      language: 'pt-BR',
      microphone: 'Microfone USB',
      voskModelPath: '/modelos/vosk-pt',
    });
    expect(result.holyricsHost).toBe('192.168.1.20');
    expect(result.holyricsApiTokenConfigured).toBe(true);
  });

  it('aceita campos opcionais vazios', () => {
    const repository = createRepository();
    const service = new SettingsService(repository);

    service.updateSettings({
      holyricsHost: '',
      holyricsPort: '',
      holyricsApiToken: undefined,
      language: 'pt-BR',
      microphone: '',
      voskModelPath: null,
    });

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        holyricsHost: '',
        holyricsPort: null,
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
    const repository = createRepository();
    const service = new SettingsService(repository);

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
    });
    const service = new SettingsService(repository);

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
      }),
    );
  });

  it('remove o token quando recebe null', () => {
    const repository = createRepository();
    const service = new SettingsService(repository);

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

  it('rejeita token vazio quando enviado explicitamente', () => {
    const repository = createRepository();
    const service = new SettingsService(repository);

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
