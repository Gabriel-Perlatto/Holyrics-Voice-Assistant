import type { RealtimeService } from '../../realtime/services/realtime.service';
import type { SettingsService } from '../../settings/services/settings.service';
import { HolyricsApiError } from '../exceptions/holyrics-api.exception';
import type { HolyricsProvider } from '../interfaces/holyrics-provider.interface';
import { HolyricsBibleProjectionService } from './holyrics-bible-projection.service';

describe('HolyricsBibleProjectionService', () => {
  const settings = {
    holyricsConnectionMode: 'local' as const,
    holyricsHost: '192.168.1.20',
    holyricsPort: 8091,
    holyricsApiKey: null,
    holyricsApiToken: 'secret-token',
    language: 'pt-BR',
    microphone: null,
    voskModelPath: null,
    speechAutoStart: false,
    voiceCommandMode: 'conservative' as const,
    updatedAt: '2026-06-20T00:00:00.000Z',
  };
  const input = { reference: 'João 3:16', version: 'NVI' };

  const createService = (
    overrides = {},
    providerError?: HolyricsApiError,
  ) => {
    const settingsService = {
      getSettings: jest.fn(() => ({ ...settings, ...overrides })),
    } as unknown as jest.Mocked<SettingsService>;
    const provider = {
      request: providerError
        ? jest.fn(async () => {
            throw providerError;
          })
        : jest.fn(async () => ({
            action: 'ShowVerse',
            endpoint: '/api/ShowVerse',
            statusCode: 200,
            latencyMs: 5,
            data: {},
          })),
    } as unknown as jest.Mocked<HolyricsProvider>;
    const realtime = {
      emitSystemError: jest.fn(),
    } as unknown as jest.Mocked<RealtimeService>;
    const service = new HolyricsBibleProjectionService(
      settingsService,
      provider,
      realtime,
    );

    return { provider, realtime, service };
  };

  it('projeta com ShowVerse e versão no mesmo payload', async () => {
    const { provider, realtime, service } = createService();

    await expect(service.project(input)).resolves.toEqual(
      expect.objectContaining({
        reference: 'João 3:16',
        version: 'NVI',
        delivery: 'holyrics',
        deliveredToHolyrics: true,
        error: null,
      }),
    );
    expect(provider.request).toHaveBeenCalledWith(
      {
        mode: 'local',
        host: '192.168.1.20',
        port: 8091,
        token: 'secret-token',
      },
      'ShowVerse',
      {
        references: 'João 3:16',
        version: 'NVI',
      },
    );
    expect(realtime.emitSystemError).not.toHaveBeenCalled();
  });

  it('projeta pela API web quando o modo web está configurado', async () => {
    const { provider, service } = createService({
      holyricsConnectionMode: 'web',
      holyricsHost: '',
      holyricsPort: null,
      holyricsApiKey: 'web-api-key',
    });

    await expect(service.project(input)).resolves.toEqual(
      expect.objectContaining({
        delivery: 'holyrics',
        deliveredToHolyrics: true,
      }),
    );
    expect(provider.request).toHaveBeenCalledWith(
      {
        mode: 'web',
        apiKey: 'web-api-key',
        token: 'secret-token',
      },
      'ShowVerse',
      {
        references: 'João 3:16',
        version: 'NVI',
      },
    );
  });

  it('mantém fallback local quando Holyrics não está configurado', async () => {
    const { provider, realtime, service } = createService({
      holyricsHost: '',
      holyricsPort: null,
      holyricsApiKey: null,
      holyricsApiToken: null,
    });

    await expect(service.project(input)).resolves.toEqual(
      expect.objectContaining({
        delivery: 'local-only',
        deliveredToHolyrics: false,
        error: null,
      }),
    );
    expect(provider.request).not.toHaveBeenCalled();
    expect(realtime.emitSystemError).not.toHaveBeenCalled();
  });

  it('trata token ausente como falha segura', async () => {
    const { provider, realtime, service } = createService({
      holyricsApiToken: null,
    });

    const result = await service.project(input);

    expect(result).toEqual(
      expect.objectContaining({
        delivery: 'failed',
        deliveredToHolyrics: false,
        error: 'O token da API local do Holyrics não está configurado.',
      }),
    );
    expect(provider.request).not.toHaveBeenCalled();
    expect(realtime.emitSystemError).toHaveBeenCalledWith({
      source: 'holyrics-bible-projection',
      message: 'O token da API local do Holyrics não está configurado.',
    });
  });

  it('trata credenciais web ausentes como falha segura', async () => {
    const { provider, realtime, service } = createService({
      holyricsConnectionMode: 'web',
      holyricsApiKey: null,
    });

    const result = await service.project(input);

    expect(result).toEqual(
      expect.objectContaining({
        delivery: 'failed',
        deliveredToHolyrics: false,
        error:
          'A API key e o token do Holyrics web não estão configurados.',
      }),
    );
    expect(provider.request).not.toHaveBeenCalled();
    expect(realtime.emitSystemError).toHaveBeenCalledWith({
      source: 'holyrics-bible-projection',
      message:
        'A API key e o token do Holyrics web não estão configurados.',
    });
  });

  it.each([
    [
      'AUTHENTICATION_FAILED',
      'O token da API Holyrics é inválido.',
    ],
    [
      'TIMEOUT',
      'O Holyrics não respondeu dentro do tempo limite.',
    ],
    [
      'PERMISSION_DENIED',
      'O token não possui permissão para: ShowVerse.',
    ],
  ] as const)(
    'mantém fallback em erro %s',
    async (code, message) => {
      const { realtime, service } = createService(
        {},
        new HolyricsApiError(code, message),
      );

      await expect(service.project(input)).resolves.toEqual(
        expect.objectContaining({
          delivery: 'failed',
          deliveredToHolyrics: false,
          error: message,
        }),
      );
      expect(realtime.emitSystemError).toHaveBeenCalledWith({
        source: 'holyrics-bible-projection',
        message,
      });
    },
  );

  it('não expõe token no status público', async () => {
    const { service } = createService();

    await service.project(input);
    const status = service.getStatus();

    expect(status).not.toHaveProperty('token');
    expect(JSON.stringify(status)).not.toContain('secret-token');
  });
});
