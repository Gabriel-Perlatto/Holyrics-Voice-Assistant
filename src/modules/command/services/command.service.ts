import { Injectable } from '@nestjs/common';
import { BibleNavigationService } from '../../bible/services/bible-navigation.service';
import { RealtimeEventType } from '../../realtime/enums/realtime-event-type.enum';
import { RealtimeService } from '../../realtime/services/realtime.service';
import { SettingsService } from '../../settings/services/settings.service';
import { CommandType } from '../enums/command-type.enum';
import type {
  CommandStatus,
  CommandIdentification,
  IdentifiedCommand,
} from '../interfaces/command.interface';
import { PtBrCommandParser } from '../parsers/pt-br-command.parser';
import { BookNameCorrectionService } from './book-name-correction.service';
import { CommandContextService } from './command-context.service';
import { CommandIntentGuardService } from './command-intent-guard.service';
import { NumberNormalizerService } from './number-normalizer.service';
import { TranscriptionCorrectionService } from './transcription-correction.service';

/**
 * Máximo de palavras do fim da transcrição anterior consideradas ao tentar
 * recuperar um comando partido entre dois segmentos (ver `identify`).
 */
const MAX_BOUNDARY_MERGE_WORDS = 8;

@Injectable()
export class CommandService {
  private lastTranscription: string | null = null;
  private lastNormalizedTranscription: string | null = null;
  private lastCommand: CommandIdentification | null = null;

  constructor(
    private readonly parser: PtBrCommandParser,
    private readonly numberNormalizer: NumberNormalizerService,
    private readonly transcriptionCorrection: TranscriptionCorrectionService,
    private readonly bookNameCorrection: BookNameCorrectionService,
    private readonly contextService: CommandContextService,
    private readonly realtimeService: RealtimeService,
    private readonly navigationService: BibleNavigationService,
    private readonly intentGuard: CommandIntentGuardService,
    private readonly settingsService: SettingsService,
  ) {}

  async identify(input: unknown): Promise<CommandIdentification> {
    const previousNormalizedTranscription =
      this.lastNormalizedTranscription;
    // Um segmento anterior que já executou não deve virar isca para uma
    // junção de borda: o comando dele já foi resolvido, e reaproveitar seu
    // texto arrisca reconstruir e reexecutar a mesma referência por
    // coincidência com palavras soltas do segmento novo.
    const previousWasExecuted =
      this.lastCommand?.intentDecision === 'execute';
    const ownNormalizedInput = this.correctTranscription(input);
    const settings = this.settingsService.getSettings();
    const activationWord = settings.voiceActivationWord ?? null;

    let normalizedInput = ownNormalizedInput;
    let command = this.parser.parseTranscription(normalizedInput);
    // Avaliação exploratória, sem gravar efeitos de repetição — a decisão
    // real (que grava) só acontece uma vez, depois de escolher entre o
    // segmento isolado e a junção de borda.
    const preview = this.intentGuard.decide(
      input,
      normalizedInput,
      command,
      activationWord,
      false,
    );

    // O comando pode ter ficado partido entre o fim do segmento anterior e o
    // início deste (fala contínua sem pausa, corte natural do Vosk ou corte
    // proativo do VoskSpeechProvider). Isso cobre dois casos: o segmento
    // atual sozinho não forma nenhum comando, ou forma uma referência válida
    // mas sem o verbo de ação que ficou no segmento anterior — nos dois, o
    // guard retorna `unknown_or_unsafe` isoladamente.
    if (
      preview.reason === 'unknown_or_unsafe' &&
      typeof input === 'string' &&
      previousNormalizedTranscription &&
      !previousWasExecuted
    ) {
      const merged = this.correctTranscription(
        `${this.mergeTail(previousNormalizedTranscription)} ${input}`,
      );
      const mergedCommand = this.parser.parseTranscription(merged);
      const mergedPreview = this.intentGuard.decide(
        input,
        merged,
        mergedCommand,
        activationWord,
        false,
      );

      if (mergedPreview.decision === 'execute') {
        normalizedInput = merged;
        command = mergedCommand;
      }
    }

    const intent = this.intentGuard.decide(
      input,
      normalizedInput,
      command,
      activationWord,
    );

    const confidence =
      command.type === CommandType.UNKNOWN ? 0 : 1;
    const identification: CommandIdentification = {
      command,
      confidence,
      intentDecision: intent.decision,
      intentReason: intent.reason,
    };
    const identifiedCommand: IdentifiedCommand = {
      ...command,
      confidence,
    };

    this.lastTranscription =
      typeof input === 'string' ? input : null;
    // Sempre a correção do segmento atual isoladamente — nunca o resultado
    // de uma junção de borda — para que a próxima tentativa de junção não
    // arraste palavras já usadas em uma junção anterior.
    this.lastNormalizedTranscription =
      typeof input === 'string' ? ownNormalizedInput : null;
    this.lastCommand = identification;

    if (command.type === CommandType.BIBLE_REFERENCE) {
      this.contextService.rememberReference(command);
    }

    this.realtimeService.emit(
      RealtimeEventType.COMMAND_IDENTIFIED,
      identification,
    );

    if (intent.decision === 'execute') {
      await this.navigationService.apply(identifiedCommand);
    }

    return identification;
  }

  private correctTranscription(input: unknown): string {
    const numberNormalized = this.numberNormalizer.normalize(input);
    const keywordCorrected =
      this.transcriptionCorrection.correct(numberNormalized);

    return this.bookNameCorrection.correct(keywordCorrected);
  }

  /**
   * Quando o pregador fala sem pausar, um comando pode ficar partido entre
   * o fim de um segmento e o início do próximo (por corte natural do Vosk
   * ou pelo corte proativo do `VoskSpeechProvider`). Se o segmento atual
   * sozinho não forma um comando, tenta de novo com o fim do segmento
   * anterior colado na frente.
   */
  private mergeTail(previousNormalizedTranscription: string): string {
    const words = previousNormalizedTranscription
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    return words.slice(-MAX_BOUNDARY_MERGE_WORDS).join(' ');
  }

  getStatus(): CommandStatus {
    return {
      lastTranscription: this.lastTranscription,
      lastNormalizedTranscription:
        this.lastNormalizedTranscription,
      lastCommand: this.lastCommand
        ? {
            ...this.lastCommand,
            command: { ...this.lastCommand.command },
          }
        : null,
      context: this.contextService.getContext(),
    };
  }
}
