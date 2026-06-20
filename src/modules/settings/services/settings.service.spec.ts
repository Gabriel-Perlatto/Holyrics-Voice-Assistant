import { BadRequestException } from '@nestjs/common';
import type { SettingsRepository } from '../repositories/settings.repository';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  const currentSettings = {
    holyricsHost: '',
    holyricsPort: null,
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
  });

  it('normaliza e salva configurações válidas', () => {
    const repository = createRepository();
    const service = new SettingsService(repository);

    const result = service.updateSettings({
      holyricsHost: ' 192.168.1.20 ',
      holyricsPort: 8091,
      language: 'pt-BR',
      microphone: ' Microfone USB ',
      voskModelPath: ' /modelos/vosk-pt ',
    });

    expect(repository.save).toHaveBeenCalledWith({
      holyricsHost: '192.168.1.20',
      holyricsPort: 8091,
      language: 'pt-BR',
      microphone: 'Microfone USB',
      voskModelPath: '/modelos/vosk-pt',
    });
    expect(result.holyricsHost).toBe('192.168.1.20');
  });

  it('aceita campos opcionais vazios', () => {
    const repository = createRepository();
    const service = new SettingsService(repository);

    service.updateSettings({
      holyricsHost: '',
      holyricsPort: '',
      language: 'pt-BR',
      microphone: '',
      voskModelPath: null,
    });

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        holyricsHost: '',
        holyricsPort: null,
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
});
