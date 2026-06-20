import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SettingsService } from '../../settings/services/settings.service';
import { HolyricsConnectionError } from '../exceptions/holyrics-connection.exception';
import type { HolyricsConnectionResult } from '../interfaces/holyrics-connection.interface';
import {
  HOLYRICS_PROVIDER,
  type HolyricsProvider,
} from '../interfaces/holyrics-provider.interface';

@Injectable()
export class HolyricsService {
  private readonly logger = new Logger(HolyricsService.name);

  constructor(
    private readonly settingsService: SettingsService,
    @Inject(HOLYRICS_PROVIDER)
    private readonly holyricsProvider: HolyricsProvider,
  ) {}

  async testConnection(): Promise<HolyricsConnectionResult> {
    const settings = this.settingsService.getSettings();

    if (!settings.holyricsHost || settings.holyricsPort === null) {
      throw new BadRequestException(
        'Configure e salve o host e a porta do Holyrics antes de testar a conexão.',
      );
    }

    try {
      const result = await this.holyricsProvider.testConnection({
        host: settings.holyricsHost,
        port: settings.holyricsPort,
      });

      this.logger.log(
        `Endereço do Holyrics respondeu em ${result.latencyMs} ms (${result.url}).`,
      );

      return {
        connected: true,
        message:
          'O endereço configurado respondeu via HTTP. A identidade do Holyrics ainda não é verificada por este teste.',
        ...result,
        checkedAt: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HolyricsConnectionError) {
        this.logger.warn(
          `Falha ao acessar ${settings.holyricsHost}:${settings.holyricsPort}: ${error.message}`,
        );

        throw new ServiceUnavailableException(error.message);
      }

      this.logger.error(
        `Erro inesperado ao testar ${settings.holyricsHost}:${settings.holyricsPort}.`,
      );

      throw new ServiceUnavailableException(
        'Não foi possível testar a conexão com o Holyrics.',
      );
    }
  }
}
