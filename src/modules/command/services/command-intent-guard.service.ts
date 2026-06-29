import { Injectable } from '@nestjs/common';
import type { VoiceCommandMode } from '../../settings/interfaces/settings.interface';
import { CommandType } from '../enums/command-type.enum';
import type {
  CommandIntentGuardDecision,
  StructuredCommand,
} from '../interfaces/command.interface';
import { PtBrCommandParser } from '../parsers/pt-br-command.parser';
import { CommandIntentClassifierService } from './command-intent-classifier.service';

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
    private readonly classifier: CommandIntentClassifierService,
  ) {}

  async decide(
    originalTranscription: unknown,
    normalizedTranscription: string,
    command: StructuredCommand,
    mode: VoiceCommandMode,
    language = 'pt-BR',
  ): Promise<CommandIntentGuardDecision> {
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
    const classification = await this.classifier.classify(
      language,
      normalized,
    );

    if (classification) {
      if (
        mode === 'fast' &&
        isDirectReference &&
        classification.reason === 'unknown_or_unsafe'
      ) {
        return {
          decision: 'execute',
          reason: 'explicit_action',
        };
      }

      return {
        decision: classification.decision,
        reason: classification.reason,
      };
    }

    if (command.type !== CommandType.BIBLE_REFERENCE) {
      return DIRECT_RELATIVE_COMMANDS.has(normalized)
        ? { decision: 'execute', reason: 'explicit_action' }
        : {
            decision: 'ignore',
            reason: 'relative_reference_context',
          };
    }

    if (mode === 'fast' && isDirectReference) {
      return {
        decision: 'execute',
        reason: 'explicit_action',
      };
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
