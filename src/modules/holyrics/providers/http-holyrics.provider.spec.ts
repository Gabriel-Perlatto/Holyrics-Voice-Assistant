import { HolyricsApiError } from '../exceptions/holyrics-api.exception';
import type { HttpFetch } from './http-client.provider';
import { HttpHolyricsProvider } from './http-holyrics.provider';

describe('HttpHolyricsProvider', () => {
  const target = {
    host: '192.168.1.20',
    port: 8091,
    token: 'secret-token',
  };

  it('executa uma ação oficial autenticada via POST', async () => {
    const httpFetch: jest.MockedFunction<HttpFetch> = jest.fn(
      async (_input, _init) =>
        Response.json({
          status: 'ok',
          data: {
            version: '2.28.1',
            permissions: 'GetTokenInfo,GetVersion',
          },
        }),
    );
    const provider = new HttpHolyricsProvider(httpFetch);

    await expect(
      provider.request(target, 'GetTokenInfo'),
    ).resolves.toEqual(
      expect.objectContaining({
        action: 'GetTokenInfo',
        endpoint: '/api/GetTokenInfo',
        statusCode: 200,
        latencyMs: expect.any(Number),
        data: expect.objectContaining({ version: '2.28.1' }),
      }),
    );

    const [requestUrl, requestInit] = httpFetch.mock.calls[0];

    expect(String(requestUrl)).toBe(
      'http://192.168.1.20:8091/api/GetTokenInfo?token=secret-token',
    );
    expect(requestInit).toEqual(
      expect.objectContaining({
        method: 'POST',
        body: '{}',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }),
    );
  });

  it('traduz token inválido para erro de autenticação', async () => {
    const httpFetch = jest.fn(async () =>
      Response.json({
        status: 'error',
        error: 'invalid token',
      }),
    );
    const provider = new HttpHolyricsProvider(httpFetch as HttpFetch);

    await expect(
      provider.request(target, 'GetTokenInfo'),
    ).rejects.toEqual(
      expect.objectContaining<Partial<HolyricsApiError>>({
        code: 'AUTHENTICATION_FAILED',
        message: expect.stringContaining('token'),
      }),
    );
  });

  it('expõe ações sem permissão sem vazar o token', async () => {
    const httpFetch = jest.fn(async () =>
      Response.json({
        status: 'error',
        error: {
          unauthorized_actions: 'GetVersion,GetAPIServerInfo',
          request_status: 'denied',
        },
      }),
    );
    const provider = new HttpHolyricsProvider(httpFetch as HttpFetch);

    await expect(
      provider.request(target, 'CheckPermissions', {
        actions: 'GetVersion,GetAPIServerInfo',
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<HolyricsApiError>>({
        code: 'PERMISSION_DENIED',
        message: expect.stringContaining('GetVersion'),
        details: {
          unauthorizedActions: ['GetVersion', 'GetAPIServerInfo'],
        },
      }),
    );
  });

  it('traduz conexão recusada para erro compreensível', async () => {
    const connectionError = Object.assign(new Error('fetch failed'), {
      cause: { code: 'ECONNREFUSED' },
    });
    const httpFetch = jest.fn(async () => {
      throw connectionError;
    });
    const provider = new HttpHolyricsProvider(httpFetch as HttpFetch);

    await expect(
      provider.request(target, 'GetTokenInfo'),
    ).rejects.toEqual(
      expect.objectContaining<Partial<HolyricsApiError>>({
        code: 'CONNECTION_REFUSED',
        message: expect.stringContaining('conexão foi recusada'),
      }),
    );
  });

  it('interrompe requisições que excedem o timeout', async () => {
    jest.useFakeTimers();
    const httpFetch = jest.fn(
      async (_url: URL | RequestInfo, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
    );
    const provider = new HttpHolyricsProvider(httpFetch as HttpFetch);
    const request = provider.request(target, 'GetTokenInfo');
    const expectation = expect(request).rejects.toEqual(
      expect.objectContaining<Partial<HolyricsApiError>>({
        code: 'TIMEOUT',
      }),
    );

    await jest.advanceTimersByTimeAsync(3_000);

    await expectation;
    jest.useRealTimers();
  });
});
