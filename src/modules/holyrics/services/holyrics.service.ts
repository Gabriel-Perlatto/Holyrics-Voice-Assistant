import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { SettingsService } from '../../settings/services/settings.service';
import { RealtimeEventType } from '../../realtime/enums/realtime-event-type.enum';
import { RealtimeService } from '../../realtime/services/realtime.service';
import type { CheckHolyricsPermissionsDto } from '../dto/check-holyrics-permissions.dto';
import { HolyricsApiError } from '../exceptions/holyrics-api.exception';
import type {
  HolyricsApiServerInfo,
  HolyricsApiTarget,
  HolyricsAuthenticationResult,
  HolyricsConnectionResult,
  HolyricsInformationResult,
  HolyricsPermissionCheckResult,
  HolyricsTokenInfo,
  HolyricsVersionInfo,
} from '../interfaces/holyrics-api.interface';
import {
  HOLYRICS_PROVIDER,
  type HolyricsProvider,
} from '../interfaces/holyrics-provider.interface';

const MINIMUM_SUPPORTED_VERSION = '2.26.0';
const PHASE_REQUIRED_PERMISSIONS = [
  'GetTokenInfo',
  'CheckPermissions',
  'GetVersion',
  'GetAPIServerInfo',
  'ShowVerse',
];

@Injectable()
export class HolyricsService {
  private readonly logger = new Logger(HolyricsService.name);

  constructor(
    private readonly settingsService: SettingsService,
    @Inject(HOLYRICS_PROVIDER)
    private readonly holyricsProvider: HolyricsProvider,
    private readonly realtimeService: RealtimeService,
  ) {}

  async testConnection(): Promise<HolyricsConnectionResult> {
    let target: HolyricsApiTarget | undefined;

    try {
      target = this.getTarget();
      const tokenResult = await this.requestTokenInfo(target);
      this.ensureCompatibleVersion(tokenResult.data.version);
      const permissionResult = await this.requestPermissionCheck(
        target,
        PHASE_REQUIRED_PERMISSIONS,
      );
      const [versionResult, apiServerResult] = await Promise.all([
        this.holyricsProvider.request<HolyricsVersionInfo>(
          target,
          'GetVersion',
        ),
        this.holyricsProvider.request<HolyricsApiServerInfo>(
          target,
          'GetAPIServerInfo',
        ),
      ]);
      const versionInfo = this.normalizeVersionInfo(versionResult.data);
      const permissions = this.parsePermissions(
        tokenResult.data.permissions,
      );
      const result = this.buildInformationResult(
        versionInfo,
        apiServerResult.data,
        permissions,
      );
      const latencyMs =
        tokenResult.latencyMs +
        permissionResult.latencyMs +
        Math.max(versionResult.latencyMs, apiServerResult.latencyMs);

      this.logger.log(`API Server do Holyrics autenticado (${result.version}).`);

      const connectionResult = {
        ...result,
        latencyMs,
        checkedAt: new Date().toISOString(),
      };

      this.emitConnected(connectionResult.version, connectionResult.checkedAt);

      return connectionResult;
    } catch (error) {
      this.emitDisconnected(error);
      this.handleApiError(error, target);
    }
  }

  async validateAuthentication(): Promise<HolyricsAuthenticationResult> {
    let target: HolyricsApiTarget | undefined;

    try {
      target = this.getTarget();
      const result = await this.requestTokenInfo(target);
      const permissions = this.parsePermissions(result.data.permissions);
      const checkedAt = new Date().toISOString();

      const authenticationResult: HolyricsAuthenticationResult = {
        connected: true,
        authenticated: true,
        version: result.data.version,
        permissions,
        message: 'Token autenticado pelo API Server do Holyrics.',
        checkedAt,
      };

      this.emitConnected(authenticationResult.version, checkedAt);

      return authenticationResult;
    } catch (error) {
      this.emitDisconnected(error);
      this.handleApiError(error, target);
    }
  }

  async getApiInformation(): Promise<HolyricsInformationResult> {
    const target = this.getTarget();

    try {
      const tokenResult = await this.requestTokenInfo(target);
      this.ensureCompatibleVersion(tokenResult.data.version);
      const [versionResult, apiServerResult] = await Promise.all([
        this.holyricsProvider.request<HolyricsVersionInfo>(
          target,
          'GetVersion',
        ),
        this.holyricsProvider.request<HolyricsApiServerInfo>(
          target,
          'GetAPIServerInfo',
        ),
      ]);

      return this.buildInformationResult(
        this.normalizeVersionInfo(versionResult.data),
        apiServerResult.data,
        this.parsePermissions(tokenResult.data.permissions),
      );
    } catch (error) {
      this.handleApiError(error, target);
    }
  }

  async checkPermissions(
    input: CheckHolyricsPermissionsDto,
  ): Promise<HolyricsPermissionCheckResult> {
    const target = this.getTarget();
    const actions = this.validateActions(input);

    try {
      await this.requestPermissionCheck(target, actions);

      return {
        authenticated: true,
        authorized: true,
        actions,
        message: 'O token possui todas as permissões solicitadas.',
        checkedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.handleApiError(error, target);
    }
  }

  private getTarget(): HolyricsApiTarget {
    const settings = this.settingsService.getSettings();

    if (!settings.holyricsHost || settings.holyricsPort === null) {
      throw new BadRequestException(
        'Configure e salve o host e a porta do Holyrics antes de acessar a API.',
      );
    }

    if (!settings.holyricsApiToken) {
      throw new BadRequestException(
        'Configure e salve o token da API Holyrics antes de testar a autenticação.',
      );
    }

    return {
      host: settings.holyricsHost,
      port: settings.holyricsPort,
      token: settings.holyricsApiToken,
    };
  }

  private requestTokenInfo(target: HolyricsApiTarget) {
    return this.holyricsProvider.request<HolyricsTokenInfo>(
      target,
      'GetTokenInfo',
    );
  }

  private requestPermissionCheck(
    target: HolyricsApiTarget,
    actions: string[],
  ) {
    return this.holyricsProvider.request<unknown>(
      target,
      'CheckPermissions',
      { actions: actions.join(',') },
    );
  }

  private buildInformationResult(
    versionInfo: HolyricsVersionInfo,
    apiServerInfo: HolyricsApiServerInfo,
    permissions: string[],
  ): HolyricsInformationResult {
    return {
      connected: true,
      authenticated: true,
      version: versionInfo.version,
      platform: versionInfo.platform,
      platformDescription: versionInfo.platformDescription,
      permissions,
      apiServer: {
        enabledLocal: apiServerInfo.enabled_local,
        enabledWeb: apiServerInfo.enabled_web,
        port: apiServerInfo.port,
        ipList: apiServerInfo.ip_list,
      },
      message: 'Conexão autenticada com o API Server do Holyrics.',
      checkedAt: new Date().toISOString(),
    };
  }

  private normalizeVersionInfo(
    data: HolyricsVersionInfo,
  ): HolyricsVersionInfo {
    if (data.version) {
      return data;
    }

    const nestedData = (data as unknown as { data?: HolyricsVersionInfo })
      .data;

    if (nestedData?.version) {
      return nestedData;
    }

    throw new HolyricsApiError(
      'INVALID_RESPONSE',
      'O Holyrics não informou uma versão válida.',
    );
  }

  private parsePermissions(value: string): string[] {
    return value
      .split(',')
      .map((permission) => permission.trim())
      .filter(Boolean);
  }

  private validateActions(
    input: CheckHolyricsPermissionsDto,
  ): string[] {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new BadRequestException(
        'Informe as permissões que devem ser verificadas.',
      );
    }

    if (!Array.isArray(input.actions) || input.actions.length === 0) {
      throw new BadRequestException(
        'Informe ao menos uma permissão do Holyrics.',
      );
    }

    if (input.actions.length > 50) {
      throw new BadRequestException(
        'É possível verificar no máximo 50 permissões por requisição.',
      );
    }

    const actions = input.actions.map((action) => {
      if (
        typeof action !== 'string' ||
        !/^[A-Za-z][A-Za-z0-9]{0,99}$/.test(action)
      ) {
        throw new BadRequestException(
          'As permissões devem usar nomes de ações oficiais do Holyrics.',
        );
      }

      return action;
    });

    return [...new Set(actions)];
  }

  private ensureCompatibleVersion(version: string): void {
    if (this.compareVersions(version, MINIMUM_SUPPORTED_VERSION) < 0) {
      throw new ConflictException(
        `A Phase 5.5 requer Holyrics ${MINIMUM_SUPPORTED_VERSION} ou superior. Versão encontrada: ${version}.`,
      );
    }
  }

  private compareVersions(left: string, right: string): number {
    const leftParts = left.split('.').map(Number);
    const rightParts = right.split('.').map(Number);

    if (
      leftParts.some((part) => !Number.isInteger(part)) ||
      rightParts.some((part) => !Number.isInteger(part))
    ) {
      throw new HolyricsApiError(
        'INVALID_RESPONSE',
        'O Holyrics retornou uma versão em formato inválido.',
      );
    }

    for (let index = 0; index < 3; index += 1) {
      const difference =
        (leftParts[index] ?? 0) - (rightParts[index] ?? 0);

      if (difference !== 0) {
        return difference;
      }
    }

    return 0;
  }

  private handleApiError(
    error: unknown,
    target?: HolyricsApiTarget,
  ): never {
    if (error instanceof BadRequestException) {
      throw error;
    }

    if (error instanceof ConflictException) {
      throw error;
    }

    if (error instanceof HolyricsApiError) {
      this.logger.warn(
        target
          ? `Falha na API do Holyrics em ${target.host}:${target.port}: ${error.code}.`
          : `Falha na API do Holyrics: ${error.code}.`,
      );

      if (error.code === 'AUTHENTICATION_FAILED') {
        throw new UnauthorizedException(error.message);
      }

      if (error.code === 'PERMISSION_DENIED') {
        throw new ForbiddenException({
          message: error.message,
          code: error.code,
          ...error.details,
        });
      }

      if (error.code === 'INVALID_RESPONSE') {
        throw new BadGatewayException(error.message);
      }

      throw new ServiceUnavailableException(error.message);
    }

    this.logger.error(
      target
        ? `Erro inesperado na API do Holyrics em ${target.host}:${target.port}.`
        : 'Erro inesperado na API do Holyrics.',
    );

    throw new ServiceUnavailableException(
      'Não foi possível acessar o API Server do Holyrics.',
    );
  }

  private emitConnected(version: string, checkedAt: string): void {
    this.realtimeService.emit(
      RealtimeEventType.HOLYRICS_CONNECTED,
      {
        connected: true,
        authenticated: true,
        version,
        checkedAt,
      },
    );
  }

  private emitDisconnected(error: unknown): void {
    this.realtimeService.emit(
      RealtimeEventType.HOLYRICS_DISCONNECTED,
      {
        connected: false,
        authenticated: false,
        reason: this.getSafeErrorMessage(error),
        checkedAt: new Date().toISOString(),
      },
    );
  }

  private getSafeErrorMessage(error: unknown): string {
    if (
      error instanceof BadRequestException ||
      error instanceof ConflictException ||
      error instanceof HolyricsApiError
    ) {
      return error.message;
    }

    return 'Não foi possível acessar o API Server do Holyrics.';
  }
}
