import { Inject, Injectable } from '@nestjs/common';
import { performance } from 'node:perf_hooks';
import { HolyricsConnectionError } from '../exceptions/holyrics-connection.exception';
import type {
  HolyricsConnectionTarget,
  HolyricsProviderConnectionResult,
} from '../interfaces/holyrics-connection.interface';
import type { HolyricsProvider } from '../interfaces/holyrics-provider.interface';
import { HTTP_FETCH, type HttpFetch } from './http-client.provider';

const CONNECTION_TIMEOUT_MS = 3_000;

@Injectable()
export class HttpHolyricsProvider implements HolyricsProvider {
  constructor(
    @Inject(HTTP_FETCH)
    private readonly httpFetch: HttpFetch,
  ) {}

  async testConnection(
    target: HolyricsConnectionTarget,
  ): Promise<HolyricsProviderConnectionResult> {
    const url = `http://${target.host}:${target.port}/`;
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      CONNECTION_TIMEOUT_MS,
    );
    const startedAt = performance.now();

    try {
      const response = await this.httpFetch(url, {
        method: 'GET',
        headers: { Accept: '*/*' },
        redirect: 'manual',
        signal: controller.signal,
      });

      return {
        url,
        statusCode: response.status,
        latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
      };
    } catch (error) {
      throw this.mapConnectionError(error, controller.signal.aborted);
    } finally {
      clearTimeout(timeout);
    }
  }

  private mapConnectionError(
    error: unknown,
    timedOut: boolean,
  ): HolyricsConnectionError {
    if (timedOut) {
      return new HolyricsConnectionError(
        'TIMEOUT',
        'O Holyrics não respondeu dentro do tempo limite.',
      );
    }

    const errorCode = this.getErrorCode(error);

    if (errorCode === 'ECONNREFUSED') {
      return new HolyricsConnectionError(
        'CONNECTION_REFUSED',
        'A conexão foi recusada. Verifique se o Holyrics e sua API estão ativos.',
      );
    }

    if (errorCode === 'ENOTFOUND' || errorCode === 'EAI_AGAIN') {
      return new HolyricsConnectionError(
        'HOST_NOT_FOUND',
        'O host configurado não foi encontrado na rede.',
      );
    }

    return new HolyricsConnectionError(
      'UNAVAILABLE',
      'Não foi possível acessar o endereço configurado para o Holyrics.',
    );
  }

  private getErrorCode(error: unknown): string | undefined {
    if (!error || typeof error !== 'object') {
      return undefined;
    }

    if ('code' in error && typeof error.code === 'string') {
      return error.code;
    }

    if (
      'cause' in error &&
      error.cause &&
      typeof error.cause === 'object' &&
      'code' in error.cause &&
      typeof error.cause.code === 'string'
    ) {
      return error.cause.code;
    }

    return undefined;
  }
}
