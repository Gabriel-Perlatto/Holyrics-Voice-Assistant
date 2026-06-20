import { Inject, Injectable, Logger } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { basename, isAbsolute, join, resolve } from 'node:path';
import { SpeechErrorCode } from '../enums/speech-error-code.enum';
import { SpeechState } from '../enums/speech-state.enum';
import type { AudioCapture } from '../interfaces/audio-capture.interface';
import type { SpeechProvider } from '../interfaces/speech-provider.interface';
import {
  AUDIO_CAPTURE,
  VOSK_RUNTIME_LOADER,
  type VoskModel,
  type VoskRecognizer,
  type VoskRuntimeLoader,
} from '../interfaces/vosk-runtime.interface';
import {
  SpeechProviderError,
  type SpeechConfiguration,
  type SpeechMicrophone,
  type SpeechProviderHandlers,
  type SpeechProviderStatus,
} from '../interfaces/speech.interface';

const LEGACY_MODEL_FILES = [
  'final.mdl',
  'HCLr.fst',
  'Gr.fst',
  'mfcc.conf',
];
const CURRENT_MODEL_FILES = [
  'am/final.mdl',
  'conf/mfcc.conf',
  'graph/HCLG.fst',
];

@Injectable()
export class VoskSpeechProvider implements SpeechProvider {
  private readonly logger = new Logger(VoskSpeechProvider.name);
  private model: VoskModel | null = null;
  private recognizer: VoskRecognizer | null = null;
  private handlers: SpeechProviderHandlers | null = null;
  private configuration: SpeechConfiguration | null = null;
  private lastPartial = '';
  private status: SpeechProviderStatus = {
    provider: 'vosk',
    state: SpeechState.IDLE,
    initialized: false,
    capturing: false,
    modelLoaded: false,
    modelPath: null,
    modelName: null,
    microphone: null,
    errorCode: null,
    message: 'Provider aguardando configuração.',
  };

  constructor(
    @Inject(VOSK_RUNTIME_LOADER)
    private readonly runtimeLoader: VoskRuntimeLoader,
    @Inject(AUDIO_CAPTURE)
    private readonly audioCapture: AudioCapture,
  ) {}

  async initialize(
    configuration: SpeechConfiguration,
    handlers: SpeechProviderHandlers,
  ): Promise<SpeechProviderStatus> {
    await this.audioCapture.stop();
    await this.disposeResources();
    this.handlers = handlers;
    this.configuration = {
      ...configuration,
      modelPath: this.resolveModelPath(configuration.modelPath),
    };
    this.setStatus({
      state: SpeechState.INITIALIZING,
      initialized: false,
      capturing: false,
      modelLoaded: false,
      modelPath: this.configuration.modelPath,
      modelName: basename(this.configuration.modelPath),
      microphone: configuration.microphone,
      errorCode: null,
      message: 'Inicializando o modelo Vosk.',
    });

    try {
      this.validateModel(this.configuration.modelPath);
      await this.validateMicrophone(configuration.microphone);

      const runtime = this.runtimeLoader.load();
      runtime.setLogLevel(-1);
      this.model = new runtime.Model(this.configuration.modelPath);
      this.recognizer = new runtime.Recognizer({
        model: this.model,
        sampleRate: configuration.sampleRate,
      });
      this.setStatus({
        state: SpeechState.READY,
        initialized: true,
        capturing: false,
        modelLoaded: true,
        errorCode: null,
        message: 'Modelo carregado. Captura pronta para iniciar.',
      });
      this.logger.log(
        `Modelo Vosk carregado: ${this.status.modelName ?? 'modelo local'}`,
      );

      return this.getStatus();
    } catch (error) {
      const providerError = this.normalizeInitializationError(error);
      await this.disposeResources();
      this.setError(providerError);
      throw providerError;
    }
  }

  async start(): Promise<SpeechProviderStatus> {
    if (
      !this.configuration ||
      !this.recognizer ||
      !this.status.initialized
    ) {
      throw this.fail(
        SpeechErrorCode.VOSK_INITIALIZATION_FAILED,
        'Inicialize o provider antes de iniciar a captura.',
      );
    }

    if (this.status.capturing) {
      return this.getStatus();
    }

    this.setStatus({
      state: SpeechState.STARTING,
      capturing: false,
      errorCode: null,
      message: 'Iniciando captura de áudio.',
    });

    try {
      await this.audioCapture.start(
        this.configuration.microphone,
        this.configuration.sampleRate,
        {
          onAudio: (chunk) => this.processAudio(chunk),
          onFailure: (message) => this.handleCaptureFailure(message),
        },
      );
      this.setStatus({
        state: SpeechState.LISTENING,
        capturing: true,
        errorCode: null,
        message: 'Captura e transcrição em andamento.',
      });

      return this.getStatus();
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : 'erro desconhecido';
      throw this.fail(
        SpeechErrorCode.CAPTURE_FAILED,
        `Não foi possível iniciar a captura: ${detail}`,
      );
    }
  }

  async stop(): Promise<SpeechProviderStatus> {
    await this.audioCapture.stop();
    this.emitFinalResult();
    this.lastPartial = '';
    this.setStatus({
      state: SpeechState.STOPPED,
      capturing: false,
      errorCode: null,
      message: this.status.initialized
        ? 'Captura parada. O modelo permanece carregado.'
        : 'Captura parada.',
    });

    return this.getStatus();
  }

  getStatus(): SpeechProviderStatus {
    return { ...this.status };
  }

  listMicrophones(): Promise<SpeechMicrophone[]> {
    return this.audioCapture.listMicrophones();
  }

  async dispose(): Promise<void> {
    await this.audioCapture.stop();
    this.emitFinalResult();
    await this.disposeResources();
    this.configuration = null;
    this.handlers = null;
    this.status = {
      provider: 'vosk',
      state: SpeechState.IDLE,
      initialized: false,
      capturing: false,
      modelLoaded: false,
      modelPath: null,
      modelName: null,
      microphone: null,
      errorCode: null,
      message: 'Provider encerrado.',
    };
  }

  private processAudio(chunk: Buffer): void {
    if (!this.recognizer || !this.handlers) {
      return;
    }

    try {
      const accepted = this.recognizer.acceptWaveform(chunk);
      const receivedAt = new Date().toISOString();

      if (accepted) {
        const text = this.recognizer.result().text?.trim();
        this.lastPartial = '';

        if (text) {
          this.handlers.onTranscription({
            text,
            final: true,
            provider: 'vosk',
            receivedAt,
          });
        }

        return;
      }

      const partial = this.recognizer.partialResult().partial?.trim();

      if (partial && partial !== this.lastPartial) {
        this.lastPartial = partial;
        this.handlers.onTranscription({
          text: partial,
          final: false,
          provider: 'vosk',
          receivedAt,
        });
      }
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : 'erro desconhecido';
      this.handleCaptureFailure(`Falha ao processar áudio: ${detail}`);
    }
  }

  private handleCaptureFailure(message: string): void {
    const error = this.fail(
      SpeechErrorCode.CAPTURE_FAILED,
      message,
    );
    this.handlers?.onError(error);
  }

  private emitFinalResult(): void {
    if (!this.recognizer || !this.handlers) {
      return;
    }

    try {
      const text = this.recognizer.finalResult().text?.trim();

      if (text) {
        this.handlers.onTranscription({
          text,
          final: true,
          provider: 'vosk',
          receivedAt: new Date().toISOString(),
        });
      }
    } catch {
      // O encerramento deve continuar mesmo se o binding não fornecer final.
    }
  }

  private resolveModelPath(modelPath: string): string {
    return isAbsolute(modelPath)
      ? modelPath
      : resolve(process.cwd(), modelPath);
  }

  private validateModel(modelPath: string): void {
    if (!existsSync(modelPath)) {
      throw new SpeechProviderError(
        SpeechErrorCode.MODEL_NOT_FOUND,
        'O diretório configurado para o modelo não foi encontrado.',
      );
    }

    const hasLegacyStructure = LEGACY_MODEL_FILES.every((file) =>
      existsSync(join(modelPath, file)),
    );
    const hasCurrentStructure = CURRENT_MODEL_FILES.every((file) =>
      existsSync(join(modelPath, file)),
    );

    if (!hasLegacyStructure && !hasCurrentStructure) {
      throw new SpeechProviderError(
        SpeechErrorCode.MODEL_INVALID,
        'O diretório não contém a estrutura esperada de um modelo Vosk.',
      );
    }
  }

  private async validateMicrophone(microphone: string): Promise<void> {
    const microphones = await this.audioCapture.listMicrophones();

    if (!microphones.some(({ id }) => id === microphone)) {
      throw new SpeechProviderError(
        SpeechErrorCode.MICROPHONE_NOT_FOUND,
        'O microfone configurado não está disponível.',
      );
    }
  }

  private normalizeInitializationError(error: unknown): SpeechProviderError {
    if (error instanceof SpeechProviderError) {
      return error;
    }

    const detail =
      error instanceof Error ? error.message : 'erro desconhecido';
    const code = detail.includes('biblioteca Vosk')
      ? SpeechErrorCode.VOSK_UNAVAILABLE
      : SpeechErrorCode.VOSK_INITIALIZATION_FAILED;

    return new SpeechProviderError(
      code,
      `Falha ao inicializar o Vosk: ${detail}`,
    );
  }

  private fail(
    code: SpeechErrorCode,
    message: string,
  ): SpeechProviderError {
    const error = new SpeechProviderError(code, message);
    this.setError(error);
    return error;
  }

  private setError(error: SpeechProviderError): void {
    this.setStatus({
      state: SpeechState.ERROR,
      initialized: Boolean(this.recognizer),
      capturing: false,
      modelLoaded: Boolean(this.model),
      errorCode: error.code,
      message: error.message,
    });
    this.logger.error(`${error.code}: ${error.message}`);
  }

  private setStatus(status: Partial<SpeechProviderStatus>): void {
    this.status = { ...this.status, ...status };
  }

  private async disposeResources(): Promise<void> {
    try {
      this.recognizer?.free();
    } catch {
      // Liberação defensiva do binding nativo.
    }

    try {
      this.model?.free();
    } catch {
      // Liberação defensiva do binding nativo.
    }

    this.recognizer = null;
    this.model = null;
    this.lastPartial = '';
  }
}
