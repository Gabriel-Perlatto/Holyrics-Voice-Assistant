import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { SettingsService } from '../../settings/services/settings.service';
import { HolyricsConnectionError } from '../exceptions/holyrics-connection.exception';
import type { HolyricsConnectionTarget } from '../interfaces/holyrics-connection.interface';
import type { HolyricsProvider } from '../interfaces/holyrics-provider.interface';
import { HolyricsService } from './holyrics.service';

describe('HolyricsService', () => {
  const settings = {
    holyricsHost: '192.168.1.20',
    holyricsPort: 8091,
    language: 'pt-BR',
    microphone: null,
    voskModelPath: null,
    updatedAt: '2026-06-20T00:00:00.000Z',
  };

  const createSettingsService = (
    overrides = {},
  ): jest.Mocked<SettingsService> =>
    ({
      getSettings: jest.fn(() => ({ ...settings, ...overrides })),
    }) as unknown as jest.Mocked<SettingsService>;

  const createProvider = (): jest.Mocked<HolyricsProvider> => ({
    testConnection: jest.fn(
      async (_target: HolyricsConnectionTarget) => ({
        url: 'http://192.168.1.20:8091/',
        statusCode: 200,
        latencyMs: 12,
      }),
    ),
  });

  it('usa host e porta persistidos no SettingsModule', async () => {
    const settingsService = createSettingsService();
    const provider = createProvider();
    const service = new HolyricsService(settingsService, provider);

    await expect(service.testConnection()).resolves.toEqual(
      expect.objectContaining({
        connected: true,
        statusCode: 200,
        url: 'http://192.168.1.20:8091/',
      }),
    );
    expect(provider.testConnection).toHaveBeenCalledWith({
      host: '192.168.1.20',
      port: 8091,
    });
  });

  it('exige host e porta salvos antes do teste', async () => {
    const service = new HolyricsService(
      createSettingsService({ holyricsHost: '', holyricsPort: null }),
      createProvider(),
    );

    await expect(service.testConnection()).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('converte falha do provider em erro HTTP claro', async () => {
    const provider = createProvider();
    provider.testConnection.mockRejectedValue(
      new HolyricsConnectionError(
        'CONNECTION_REFUSED',
        'A conexão foi recusada.',
      ),
    );
    const service = new HolyricsService(
      createSettingsService(),
      provider,
    );

    await expect(service.testConnection()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    await expect(service.testConnection()).rejects.toThrow(
      'A conexão foi recusada.',
    );
  });
});
