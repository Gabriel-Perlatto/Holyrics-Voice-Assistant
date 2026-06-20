import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { SettingsService } from '../../settings/services/settings.service';
import { RealtimeEventType } from '../../realtime/enums/realtime-event-type.enum';
import type { RealtimeService } from '../../realtime/services/realtime.service';
import { HolyricsApiError } from '../exceptions/holyrics-api.exception';
import type {
  HolyricsApiRequestResult,
  HolyricsApiTarget,
} from '../interfaces/holyrics-api.interface';
import type { HolyricsProvider } from '../interfaces/holyrics-provider.interface';
import { HolyricsService } from './holyrics.service';

describe('HolyricsService', () => {
  const settings = {
    holyricsHost: '192.168.1.20',
    holyricsPort: 8091,
    holyricsApiToken: 'secret-token',
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

  const createResult = <T>(
    action: string,
    data: T,
    latencyMs = 5,
  ): HolyricsApiRequestResult<T> => ({
    action,
    endpoint: `/api/${action}`,
    statusCode: 200,
    latencyMs,
    data,
  });

  const createProvider = (): jest.Mocked<HolyricsProvider> => {
    const request = jest.fn(
      async (
        _target: HolyricsApiTarget,
        action: string,
      ): Promise<HolyricsApiRequestResult<unknown>> => {
        if (action === 'GetTokenInfo') {
          return createResult(action, {
            version: '2.28.1',
            permissions:
              'GetTokenInfo,CheckPermissions,GetVersion,GetAPIServerInfo',
          });
        }

        if (action === 'CheckPermissions') {
          return createResult(action, true);
        }

        if (action === 'GetVersion') {
          return createResult(action, {
            version: '2.28.1',
            platform: 'win',
            platformDescription: 'Windows 11',
          });
        }

        if (action === 'GetAPIServerInfo') {
          return createResult(action, {
            enabled_local: true,
            enabled_web: false,
            port: 8091,
            ip_list: ['192.168.1.20'],
          });
        }

        throw new Error(`Unexpected action: ${action}`);
      },
    );

    return {
      request,
    } as unknown as jest.Mocked<HolyricsProvider>;
  };

  const createRealtimeService = (): jest.Mocked<RealtimeService> =>
    ({
      emit: jest.fn(),
    }) as unknown as jest.Mocked<RealtimeService>;

  const createService = (
    settingsService = createSettingsService(),
    provider = createProvider(),
    realtimeService = createRealtimeService(),
  ) => ({
    provider,
    realtimeService,
    service: new HolyricsService(
      settingsService,
      provider,
      realtimeService,
    ),
  });

  it('testa a conexão usando somente ações oficiais autenticadas', async () => {
    const settingsService = createSettingsService();
    const provider = createProvider();
    const realtimeService = createRealtimeService();
    const service = createService(
      settingsService,
      provider,
      realtimeService,
    ).service;

    await expect(service.testConnection()).resolves.toEqual(
      expect.objectContaining({
        connected: true,
        authenticated: true,
        version: '2.28.1',
        platform: 'win',
        permissions: expect.arrayContaining(['GetTokenInfo']),
        apiServer: expect.objectContaining({
          enabledLocal: true,
          port: 8091,
        }),
        latencyMs: expect.any(Number),
      }),
    );

    expect(provider.request).toHaveBeenCalledWith(
      {
        host: '192.168.1.20',
        port: 8091,
        token: 'secret-token',
      },
      'GetTokenInfo',
    );
    expect(provider.request).toHaveBeenCalledWith(
      expect.any(Object),
      'CheckPermissions',
      {
        actions:
          'GetTokenInfo,CheckPermissions,GetVersion,GetAPIServerInfo',
      },
    );
    expect(provider.request).toHaveBeenCalledWith(
      expect.any(Object),
      'GetVersion',
    );
    expect(provider.request).toHaveBeenCalledWith(
      expect.any(Object),
      'GetAPIServerInfo',
    );
    expect(realtimeService.emit).toHaveBeenCalledWith(
      RealtimeEventType.HOLYRICS_CONNECTED,
      expect.objectContaining({
        connected: true,
        authenticated: true,
        version: '2.28.1',
      }),
    );
    expect(realtimeService.emit.mock.calls[0][1]).not.toHaveProperty(
      'token',
    );
  });

  it('valida autenticação com GetTokenInfo', async () => {
    const { service, realtimeService } = createService();

    await expect(service.validateAuthentication()).resolves.toEqual(
      expect.objectContaining({
        authenticated: true,
        version: '2.28.1',
      }),
    );
    expect(realtimeService.emit).toHaveBeenCalledWith(
      RealtimeEventType.HOLYRICS_CONNECTED,
      expect.objectContaining({
        version: '2.28.1',
      }),
    );
  });

  it('verifica permissões solicitadas', async () => {
    const provider = createProvider();
    const service = createService(
      createSettingsService(),
      provider,
    ).service;

    await expect(
      service.checkPermissions({
        actions: ['ShowVerse', 'GetBibleVersionsV2'],
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        authorized: true,
        actions: ['ShowVerse', 'GetBibleVersionsV2'],
      }),
    );
    expect(provider.request).toHaveBeenCalledWith(
      expect.any(Object),
      'CheckPermissions',
      { actions: 'ShowVerse,GetBibleVersionsV2' },
    );
  });

  it('exige host, porta e token antes do teste', async () => {
    const missingAddress = createService(
      createSettingsService({ holyricsHost: '', holyricsPort: null }),
    ).service;
    const missingToken = createService(
      createSettingsService({ holyricsApiToken: null }),
    ).service;

    await expect(missingAddress.testConnection()).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(missingToken.testConnection()).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('mapeia token inválido para 401', async () => {
    const provider = createProvider();
    provider.request.mockRejectedValue(
      new HolyricsApiError(
        'AUTHENTICATION_FAILED',
        'O token da API Holyrics é inválido.',
      ),
    );
    const realtimeService = createRealtimeService();
    const service = createService(
      createSettingsService(),
      provider,
      realtimeService,
    ).service;

    await expect(service.testConnection()).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(realtimeService.emit).toHaveBeenCalledWith(
      RealtimeEventType.HOLYRICS_DISCONNECTED,
      expect.objectContaining({
        connected: false,
        authenticated: false,
        reason: 'O token da API Holyrics é inválido.',
      }),
    );
    expect(realtimeService.emit.mock.calls[0][1]).not.toHaveProperty(
      'token',
    );
  });

  it('mapeia permissão insuficiente para 403', async () => {
    const provider = createProvider();
    provider.request.mockImplementation(async (_target, action) => {
      if (action === 'GetTokenInfo') {
        return createResult(action, {
          version: '2.28.1',
          permissions: 'GetTokenInfo,CheckPermissions',
        });
      }

      throw new HolyricsApiError(
        'PERMISSION_DENIED',
        'O token não possui permissão para: GetVersion.',
        { unauthorizedActions: ['GetVersion'] },
      );
    });
    const service = createService(
      createSettingsService(),
      provider,
    ).service;

    await expect(service.testConnection()).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejeita versão incompatível antes de usar ações mais novas', async () => {
    const provider = createProvider();
    provider.request.mockResolvedValue(
      createResult('GetTokenInfo', {
        version: '2.25.0',
        permissions: 'GetTokenInfo',
      }),
    );
    const service = createService(
      createSettingsService(),
      provider,
    ).service;

    await expect(service.testConnection()).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(provider.request).toHaveBeenCalledTimes(1);
  });

  it('mapeia timeout para indisponibilidade', async () => {
    const provider = createProvider();
    provider.request.mockRejectedValue(
      new HolyricsApiError(
        'TIMEOUT',
        'O Holyrics não respondeu dentro do tempo limite.',
      ),
    );
    const service = createService(
      createSettingsService(),
      provider,
    ).service;

    await expect(service.testConnection()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
