import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { basename } from 'node:path';
import { CommandService } from '../../command/services/command.service';
import { RealtimeEventType } from '../../realtime/enums/realtime-event-type.enum';
import { RealtimeService } from '../../realtime/services/realtime.service';
import { SettingsService } from '../../settings/services/settings.service';
import { SpeechErrorCode } from '../enums/speech-error-code.enum';
import { SpeechState } from '../enums/speech-state.enum';
import {
  SPEECH_PROVIDER,
  type SpeechProvider,
} from '../interfaces/speech-provider.interface';
import {
  SpeechProviderError,
  type SpeechMicrophone,
  type SpeechStatus,
  type SpeechTranscription,
} from '../interfaces/speech.interface';

const SAMPLE_RATE = 16_000;

@Injectable()
export class SpeechService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(SpeechService.name);
  private lastTranscription: SpeechTranscription | null = null;

  constructor(
    @Inject(SPEECH_PROVIDER)
    private readonly provider: SpeechProvider,
    private readonly settingsService: SettingsService,
    private readonly realtimeService: RealtimeService,
    private readonly commandService: CommandService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const settings = this.settingsService.getSettings();

    if (!settings.speechAutoStart) {
      return;
    }

    try {
      await this.start();
      this.logger.log('Captura de voz iniciada automaticamente.');
    } catch (error) {
      this.logger.warn(
        `Inicialização automática não executada: ${this.getErrorMessage(error)}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    const wasCapturing = this.provider.getStatus().capturing;
    await this.provider.dispose();

    if (wasCapturing) {
      this.realtimeService.emit(RealtimeEventType.SPEECH_STOPPED, {
        provider: 'vosk',
        reason: 'shutdown',
      });
    }
  }

  getStatus(): SpeechStatus {
    const settings = this.settingsService.getSettings();
    const providerStatus = this.provider.getStatus();

    if (
      !providerStatus.initialized &&
      providerStatus.state !== SpeechState.ERROR
    ) {
      if (!settings.voskModelPath) {
        providerStatus.errorCode =
          SpeechErrorCode.MODEL_NOT_CONFIGURED;
        providerStatus.message =
          'Configure o caminho do modelo Vosk para habilitar a transcrição.';
      } else if (!settings.microphone) {
        providerStatus.errorCode =
          SpeechErrorCode.MICROPHONE_NOT_CONFIGURED;
        providerStatus.message =
          'Selecione um microfone para habilitar a captura.';
      } else {
        providerStatus.message =
          'Modelo e microfone configurados. Inicie a captura para carregar o provider.';
      }
    }

    return {
      ...providerStatus,
      autoStart: settings.speechAutoStart,
      lastTranscription: this.lastTranscription,
    };
  }

  listMicrophones(): Promise<SpeechMicrophone[]> {
    return this.provider.listMicrophones();
  }

  async initialize(): Promise<SpeechStatus> {
    const settings = this.settingsService.getSettings();

    if (!settings.voskModelPath) {
      return this.rejectConfiguration(
        'Configure o caminho do modelo Vosk antes de inicializar.',
      );
    }

    if (!settings.microphone) {
      return this.rejectConfiguration(
        'Selecione um microfone antes de inicializar.',
      );
    }

    try {
      await this.provider.initialize(
        {
          modelPath: settings.voskModelPath,
          microphone: settings.microphone,
          language: settings.language,
          sampleRate: SAMPLE_RATE,
        },
        {
          onTranscription: (transcription) =>
            this.handleTranscription(transcription),
          onError: (error) => this.handleProviderError(error),
        },
      );

      return this.getStatus();
    } catch (error) {
      this.emitSystemError(this.getErrorMessage(error));
      throw new ServiceUnavailableException(this.getErrorMessage(error));
    }
  }

  async start(): Promise<SpeechStatus> {
    const currentStatus = this.provider.getStatus();

    if (currentStatus.capturing) {
      return this.getStatus();
    }

    await this.initialize();

    try {
      const status = await this.provider.start();
      this.realtimeService.emit(RealtimeEventType.SPEECH_STARTED, {
        provider: 'vosk',
        model: status.modelName ?? basename(status.modelPath ?? ''),
        microphone: status.microphone ?? '',
      });

      return this.getStatus();
    } catch (error) {
      this.emitSystemError(this.getErrorMessage(error));
      throw new ServiceUnavailableException(this.getErrorMessage(error));
    }
  }

  async stop(): Promise<SpeechStatus> {
    const wasActive = [
      SpeechState.STARTING,
      SpeechState.LISTENING,
    ].includes(this.provider.getStatus().state);
    await this.provider.stop();

    if (wasActive) {
      this.realtimeService.emit(RealtimeEventType.SPEECH_STOPPED, {
        provider: 'vosk',
        reason: 'requested',
      });
    }

    return this.getStatus();
  }

  private handleTranscription(
    transcription: SpeechTranscription,
  ): void {
    this.lastTranscription = transcription;
    this.realtimeService.emit(
      RealtimeEventType.TRANSCRIPTION_RECEIVED,
      transcription,
    );

    if (transcription.final) {
      this.commandService.identify(transcription.text);
    }
  }

  private handleProviderError(error: SpeechProviderError): void {
    this.realtimeService.emit(RealtimeEventType.SPEECH_STOPPED, {
      provider: 'vosk',
      reason: 'capture-error',
    });
    this.emitSystemError(error.message);
  }

  private rejectConfiguration(message: string): never {
    this.emitSystemError(message);
    throw new ServiceUnavailableException(message);
  }

  private emitSystemError(message: string): void {
    this.realtimeService.emitSystemError({
      source: 'speech',
      message,
    });
  }

  private getErrorMessage(error: unknown): string {
    if (
      error instanceof ServiceUnavailableException &&
      typeof error.message === 'string'
    ) {
      return error.message;
    }

    return error instanceof Error
      ? error.message
      : 'Erro interno do provider de reconhecimento de voz.';
  }
}
