import { HolyricsConnectionError } from '../exceptions/holyrics-connection.exception';
import type { HttpFetch } from './http-client.provider';
import { HttpHolyricsProvider } from './http-holyrics.provider';

describe('HttpHolyricsProvider', () => {
  it('considera qualquer resposta HTTP como endereço acessível', async () => {
    const httpFetch = jest.fn(async () => new Response(null, { status: 404 }));
    const provider = new HttpHolyricsProvider(httpFetch as HttpFetch);

    await expect(
      provider.testConnection({ host: '192.168.1.20', port: 8091 }),
    ).resolves.toEqual(
      expect.objectContaining({
        url: 'http://192.168.1.20:8091/',
        statusCode: 404,
        latencyMs: expect.any(Number),
      }),
    );

    expect(httpFetch).toHaveBeenCalledWith(
      'http://192.168.1.20:8091/',
      expect.objectContaining({
        method: 'GET',
        redirect: 'manual',
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
      provider.testConnection({ host: '192.168.1.20', port: 8091 }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<HolyricsConnectionError>>({
        code: 'CONNECTION_REFUSED',
        message: expect.stringContaining('conexão foi recusada'),
      }),
    );
  });

  it('traduz host inexistente para erro compreensível', async () => {
    const hostError = Object.assign(new Error('fetch failed'), {
      cause: { code: 'ENOTFOUND' },
    });
    const httpFetch = jest.fn(async () => {
      throw hostError;
    });
    const provider = new HttpHolyricsProvider(httpFetch as HttpFetch);

    await expect(
      provider.testConnection({ host: 'holyrics.local', port: 8091 }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<HolyricsConnectionError>>({
        code: 'HOST_NOT_FOUND',
        message: expect.stringContaining('não foi encontrado'),
      }),
    );
  });
});
