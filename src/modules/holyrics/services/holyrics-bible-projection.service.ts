import { Inject, Injectable, Logger } from '@nestjs/common';
import { RealtimeService } from '../../realtime/services/realtime.service';
import { SettingsService } from '../../settings/services/settings.service';
import type { Settings } from '../../settings/interfaces/settings.interface';
import { HolyricsApiError } from '../exceptions/holyrics-api.exception';
import type {
  HolyricsBibleProjectionInput,
  HolyricsBibleProjectionResult,
} from '../interfaces/holyrics-bible-projection.interface';
import type { HolyricsApiTarget } from '../interfaces/holyrics-api.interface';
import {
  HOLYRICS_PROVIDER,
  type HolyricsProvider,
} from '../interfaces/holyrics-provider.interface';

@Injectable()
export class HolyricsBibleProjectionService {
  private readonly logger = new Logger(
    HolyricsBibleProjectionService.name,
  );
  private lastResult: HolyricsBibleProjectionResult | null = null;

  constructor(
    private readonly settingsService: SettingsService,
    @Inject(HOLYRICS_PROVIDER)
    private readonly holyricsProvider: HolyricsProvider,
    private readonly realtimeService: RealtimeService,
  ) {}

  async project(
    input: HolyricsBibleProjectionInput,
  ): Promise<HolyricsBibleProjectionResult> {
    const settings = this.settingsService.getSettings();
    const attemptedAt = new Date().toISOString();
    const target = this.getTarget(settings);

    if (target.status === 'not-configured') {
      return this.saveResult({
        ...input,
        delivery: 'local-only',
        deliveredToHolyrics: false,
        message:
          'Passagem atualizada somente no sistema local; o Holyrics não está configurado.',
        error: null,
        attemptedAt,
      });
    }

    if (target.status === 'invalid') {
      return this.fail(
        input,
        target.message,
        attemptedAt,
      );
    }

    try {
      await this.holyricsProvider.request(
        target.target,
        'ShowVerse',
        {
          references: input.reference,
          version: input.version,
        },
      );

      return this.saveResult({
        ...input,
        delivery: 'holyrics',
        deliveredToHolyrics: true,
        message: 'Passagem enviada ao Holyrics.',
        error: null,
        attemptedAt,
      });
    } catch (error) {
      return this.fail(
        input,
        this.getSafeErrorMessage(error),
        attemptedAt,
      );
    }
  }

  getStatus(): HolyricsBibleProjectionResult | null {
    return this.lastResult ? { ...this.lastResult } : null;
  }

  private fail(
    input: HolyricsBibleProjectionInput,
    message: string,
    attemptedAt: string,
  ): HolyricsBibleProjectionResult {
    this.logger.warn(`Falha ao projetar passagem no Holyrics: ${message}`);
    this.realtimeService.emitSystemError({
      source: 'holyrics-bible-projection',
      message,
    });

    return this.saveResult({
      ...input,
      delivery: 'failed',
      deliveredToHolyrics: false,
      message: 'A navegação local foi mantida, mas o envio ao Holyrics falhou.',
      error: message,
      attemptedAt,
    });
  }

  private getTarget(settings: Settings):
    | { status: 'ok'; target: HolyricsApiTarget }
    | { status: 'not-configured' }
    | { status: 'invalid'; message: string } {
    if (settings.holyricsConnectionMode === 'web') {
      if (!settings.holyricsApiKey || !settings.holyricsApiToken) {
        return {
          status: 'invalid',
          message:
            'A API key e o token do Holyrics web não estão configurados.',
        };
      }

      return {
        status: 'ok',
        target: {
          mode: 'web',
          apiKey: settings.holyricsApiKey,
          token: settings.holyricsApiToken,
        },
      };
    }

    if (!settings.holyricsHost || settings.holyricsPort === null) {
      return { status: 'not-configured' };
    }

    if (!settings.holyricsApiToken) {
      return {
        status: 'invalid',
        message: 'O token da API local do Holyrics não está configurado.',
      };
    }

    return {
      status: 'ok',
      target: {
        mode: 'local',
        host: settings.holyricsHost,
        port: settings.holyricsPort,
        token: settings.holyricsApiToken,
      },
    };
  }

  private saveResult(
    result: HolyricsBibleProjectionResult,
  ): HolyricsBibleProjectionResult {
    this.lastResult = { ...result };
    return { ...result };
  }

  private getSafeErrorMessage(error: unknown): string {
    if (error instanceof HolyricsApiError) {
      return error.message;
    }

    return 'Não foi possível enviar a passagem ao Holyrics.';
  }
}
