import { Inject, Injectable } from '@nestjs/common';
import { performance } from 'node:perf_hooks';
import { HolyricsApiError } from '../exceptions/holyrics-api.exception';
import type {
  HolyricsApiRequestResult,
  HolyricsApiTarget,
} from '../interfaces/holyrics-api.interface';
import type { HolyricsProvider } from '../interfaces/holyrics-provider.interface';
import { HTTP_FETCH, type HttpFetch } from './http-client.provider';

const REQUEST_TIMEOUT_MS = 3_000;

interface HolyricsApiEnvelope<T> {
  status?: unknown;
  data?: T;
  error?: unknown;
}

@Injectable()
export class HttpHolyricsProvider implements HolyricsProvider {
  constructor(
    @Inject(HTTP_FETCH)
    private readonly httpFetch: HttpFetch,
  ) {}

  async request<T>(
    target: HolyricsApiTarget,
    action: string,
    input: Record<string, unknown> = {},
  ): Promise<HolyricsApiRequestResult<T>> {
    const endpoint = `/api/${action}`;
    const url = new URL(
      endpoint,
      `http://${target.host}:${target.port}`,
    );
    url.searchParams.set('token', target.token);
    const requestBody = JSON.stringify(input);
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS,
    );
    const startedAt = performance.now();

    try {
      const response = await this.httpFetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: requestBody,
        signal: controller.signal,
      });
      const envelope = await this.parseResponse<T>(response);
      const latencyMs = Math.max(
        0,
        Math.round(performance.now() - startedAt),
      );

      if (envelope.status !== 'ok') {
        throw this.mapApiError(envelope.error, response.status);
      }

      return {
        action,
        endpoint,
        statusCode: response.status,
        latencyMs,
        data: envelope.data as T,
      };
    } catch (error) {
      if (error instanceof HolyricsApiError) {
        throw error;
      }

      throw this.mapConnectionError(error, controller.signal.aborted);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async parseResponse<T>(
    response: Response,
  ): Promise<HolyricsApiEnvelope<T>> {
    try {
      const body: unknown = await response.json();

      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new Error('Invalid response body');
      }

      return body as HolyricsApiEnvelope<T>;
    } catch {
      throw new HolyricsApiError(
        'INVALID_RESPONSE',
        'O Holyrics retornou uma resposta inválida.',
      );
    }
  }

  private mapApiError(
    error: unknown,
    statusCode: number,
  ): HolyricsApiError {
    const message = this.getApiErrorMessage(error);
    const normalizedMessage = message.toLowerCase();

    if (
      normalizedMessage.includes('invalid token') ||
      normalizedMessage.includes('token inválido')
    ) {
      return new HolyricsApiError(
        'AUTHENTICATION_FAILED',
        'O token da API Holyrics é inválido.',
      );
    }

    const unauthorizedActions = this.getUnauthorizedActions(error);

    if (statusCode === 401 || unauthorizedActions.length > 0) {
      return new HolyricsApiError(
        'PERMISSION_DENIED',
        unauthorizedActions.length
          ? `O token não possui permissão para: ${unauthorizedActions.join(', ')}.`
          : 'O token não possui permissão para executar esta ação.',
        { unauthorizedActions },
      );
    }

    return new HolyricsApiError(
      'UNAVAILABLE',
      message || 'O Holyrics recusou a requisição.',
    );
  }

  private mapConnectionError(
    error: unknown,
    timedOut: boolean,
  ): HolyricsApiError {
    if (timedOut) {
      return new HolyricsApiError(
        'TIMEOUT',
        'O Holyrics não respondeu dentro do tempo limite.',
      );
    }

    const errorCode = this.getErrorCode(error);

    if (errorCode === 'ECONNREFUSED') {
      return new HolyricsApiError(
        'CONNECTION_REFUSED',
        'A conexão foi recusada. Verifique se o API Server do Holyrics está ativo.',
      );
    }

    if (errorCode === 'ENOTFOUND' || errorCode === 'EAI_AGAIN') {
      return new HolyricsApiError(
        'HOST_NOT_FOUND',
        'O host configurado não foi encontrado na rede.',
      );
    }

    return new HolyricsApiError(
      'UNAVAILABLE',
      'Não foi possível acessar o API Server do Holyrics.',
    );
  }

  private getApiErrorMessage(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }

    if (!error || typeof error !== 'object') {
      return '';
    }

    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }

    return '';
  }

  private getUnauthorizedActions(error: unknown): string[] {
    if (
      !error ||
      typeof error !== 'object' ||
      !('unauthorized_actions' in error) ||
      typeof error.unauthorized_actions !== 'string'
    ) {
      return [];
    }

    return error.unauthorized_actions
      .split(',')
      .map((action) => action.trim())
      .filter(Boolean);
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
