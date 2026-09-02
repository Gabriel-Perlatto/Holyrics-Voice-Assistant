import { Injectable } from '@nestjs/common';
import { CommandType } from '../enums/command-type.enum';
import type {
  CommandIntentGuardDecision,
  StructuredCommand,
} from '../interfaces/command.interface';
import { PtBrCommandParser } from '../parsers/pt-br-command.parser';
import { CommandIntentSignalsService } from './command-intent-signals.service';
import { CommandRepetitionService } from './command-repetition.service';

const DIRECT_RELATIVE_COMMANDS = new Set([
  'proximo',
  'proximo versiculo',
  'versiculo seguinte',
  'anterior',
  'voltar',
  'versiculo anterior',
  'proximo capitulo',
  'capitulo seguinte',
  'capitulo anterior',
]);

@Injectable()
export class CommandIntentGuardService {
  constructor(
    private readonly parser: PtBrCommandParser,
    private readonly signals: CommandIntentSignalsService,
    private readonly repetition: CommandRepetitionService,
  ) {}

  /**
   * `record` controla se a decisão grava efeitos colaterais no
   * `CommandRepetitionService` (lembrar uma referência ignorada, ou limpá-la
   * ao executar). Use `record: false` para uma avaliação exploratória — por
   * exemplo, o `CommandService` testa uma junção de borda com o segmento
   * anterior antes de decidir qual texto realmente usar — e deixe o valor
   * padrão para a decisão que efetivamente será aplicada.
   */
  decide(
    originalTranscription: unknown,
    normalizedTranscription: string,
    command: StructuredCommand,
    activationWord: string | null = null,
    record = true,
  ): CommandIntentGuardDecision {
    if (command.type === CommandType.UNKNOWN) {
      return {
        decision: 'ignore',
        reason: 'unknown_or_unsafe',
      };
    }

    const normalized = this.normalize(normalizedTranscription);
    const directCommand = this.parser.parse(normalizedTranscription);
    const isDirectReference =
      directCommand.type === CommandType.BIBLE_REFERENCE;
    const signal = this.signals.detect(normalized, command, activationWord);

    if (signal) {
      if (signal.decision === 'execute' && record) {
        this.repetition.clear();
      }

      return signal;
    }

    if (command.type !== CommandType.BIBLE_REFERENCE) {
      return DIRECT_RELATIVE_COMMANDS.has(normalized)
        ? { decision: 'execute', reason: 'explicit_action' }
        : {
            decision: 'ignore',
            reason: 'relative_reference_context',
          };
    }

    if (isDirectReference) {
      if (record) {
        this.repetition.clear();
      }

      return {
        decision: 'execute',
        reason: 'explicit_action',
      };
    }

    if (this.repetition.isRepetition(command)) {
      if (record) {
        this.repetition.clear();
      }

      return {
        decision: 'execute',
        reason: 'repeated_reference',
      };
    }

    if (record) {
      this.repetition.rememberIgnored(command);
    }

    return {
      decision: 'ignore',
      reason: 'unknown_or_unsafe',
    };
  }

  private normalize(value: string): string {
    return value
      .toLocaleLowerCase('pt-BR')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[.:,;!?_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
