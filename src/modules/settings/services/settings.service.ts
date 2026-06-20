import { BadRequestException, Injectable } from '@nestjs/common';
import type { UpdateSettingsDto } from '../dto/update-settings.dto';
import type {
  PublicSettings,
  Settings,
} from '../interfaces/settings.interface';
import { SettingsRepository } from '../repositories/settings.repository';

const HOST_PATTERN = /^[a-zA-Z0-9.-]+$/;
const LANGUAGE_PATTERN = /^[a-z]{2}(?:-[A-Z]{2})?$/;

@Injectable()
export class SettingsService {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  getSettings(): Settings {
    return this.settingsRepository.find();
  }

  getPublicSettings(): PublicSettings {
    return this.toPublicSettings(this.getSettings());
  }

  updateSettings(input: UpdateSettingsDto): PublicSettings {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new BadRequestException('Configurações inválidas.');
    }

    const currentSettings = this.settingsRepository.find();
    const holyricsHost = this.validateHost(input.holyricsHost);
    const holyricsPort = this.validatePort(input.holyricsPort);
    const holyricsApiToken = this.validateApiToken(
      input.holyricsApiToken,
      currentSettings.holyricsApiToken,
    );
    const language = this.validateLanguage(input.language);
    const microphone = this.validateOptionalText(
      input.microphone,
      'Microfone',
      255,
    );
    const voskModelPath = this.validateOptionalText(
      input.voskModelPath,
      'Caminho do modelo Vosk',
      1_024,
    );

    const settings = this.settingsRepository.save({
      holyricsHost,
      holyricsPort,
      holyricsApiToken,
      language,
      microphone,
      voskModelPath,
    });

    return this.toPublicSettings(settings);
  }

  private validateHost(value: unknown): string {
    if (typeof value !== 'string') {
      throw new BadRequestException(
        'O host do Holyrics deve ser um texto.',
      );
    }

    const host = value.trim();

    if (host.length > 255) {
      throw new BadRequestException(
        'O host do Holyrics deve ter no máximo 255 caracteres.',
      );
    }

    if (host && !HOST_PATTERN.test(host)) {
      throw new BadRequestException(
        'Informe apenas o IP ou nome da máquina do Holyrics, sem protocolo ou caminho.',
      );
    }

    return host;
  }

  private validatePort(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (
      typeof value !== 'number' ||
      !Number.isInteger(value) ||
      value < 1 ||
      value > 65_535
    ) {
      throw new BadRequestException(
        'A porta do Holyrics deve ser um número inteiro entre 1 e 65535.',
      );
    }

    return value;
  }

  private validateApiToken(
    value: unknown,
    currentToken: string | null,
  ): string | null {
    if (value === undefined) {
      return currentToken;
    }

    if (value === null) {
      return null;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(
        'O token da API Holyrics deve ser um texto.',
      );
    }

    const token = value.trim();

    if (!token) {
      throw new BadRequestException(
        'Informe um token válido ou use a opção para remover o token salvo.',
      );
    }

    if (token.length > 1_024) {
      throw new BadRequestException(
        'O token da API Holyrics deve ter no máximo 1024 caracteres.',
      );
    }

    return token;
  }

  private validateLanguage(value: unknown): string {
    if (typeof value !== 'string') {
      throw new BadRequestException('O idioma deve ser um texto.');
    }

    const language = value.trim();

    if (!LANGUAGE_PATTERN.test(language)) {
      throw new BadRequestException(
        'O idioma deve usar um código como pt-BR.',
      );
    }

    return language;
  }

  private validateOptionalText(
    value: unknown,
    fieldName: string,
    maximumLength: number,
  ): string | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} deve ser um texto.`);
    }

    const text = value.trim();

    if (!text) {
      return null;
    }

    if (text.length > maximumLength) {
      throw new BadRequestException(
        `${fieldName} deve ter no máximo ${maximumLength} caracteres.`,
      );
    }

    return text;
  }

  private toPublicSettings(settings: Settings): PublicSettings {
    const { holyricsApiToken, ...publicSettings } = settings;

    return {
      ...publicSettings,
      holyricsApiTokenConfigured: Boolean(holyricsApiToken),
    };
  }
}
