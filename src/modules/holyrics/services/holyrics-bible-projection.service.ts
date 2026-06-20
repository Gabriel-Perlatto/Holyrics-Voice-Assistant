import { Inject, Injectable, Logger } from '@nestjs/common';
import { RealtimeService } from '../../realtime/services/realtime.service';
import { SettingsService } from '../../settings/services/settings.service';
import { HolyricsApiError } from '../exceptions/holyrics-api.exception';
import type {
  HolyricsBibleProjectionInput,
  HolyricsBibleProjectionResult,
} from '../interfaces/holyrics-bible-projection.interface';
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

    if (!settings.holyricsHost || settings.holyricsPort === null) {
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

    if (!settings.holyricsApiToken) {
      return this.fail(
        input,
        'O token da API Holyrics não está configurado.',
        attemptedAt,
      );
    }

    try {
      await this.holyricsProvider.request(
        {
          host: settings.holyricsHost,
          port: settings.holyricsPort,
          token: settings.holyricsApiToken,
        },
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
