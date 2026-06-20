import { Injectable } from '@nestjs/common';
import type { VoiceCommandMode } from '../../settings/interfaces/settings.interface';
import { CommandType } from '../enums/command-type.enum';
import type {
  CommandIntentGuardDecision,
  StructuredCommand,
} from '../interfaces/command.interface';
import { PtBrCommandParser } from '../parsers/pt-br-command.parser';

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
  constructor(private readonly parser: PtBrCommandParser) {}

  decide(
    originalTranscription: unknown,
    normalizedTranscription: string,
    command: StructuredCommand,
    mode: VoiceCommandMode,
  ): CommandIntentGuardDecision {
    if (command.type === CommandType.UNKNOWN) {
      return {
        decision: 'ignore',
        reason: 'unknown_or_unsafe',
      };
    }

    const original = this.normalize(
      typeof originalTranscription === 'string'
        ? originalTranscription
        : '',
    );
    const normalized = this.normalize(normalizedTranscription);

    if (command.type !== CommandType.BIBLE_REFERENCE) {
      return DIRECT_RELATIVE_COMMANDS.has(normalized)
        ? { decision: 'execute', reason: 'explicit_action' }
        : {
            decision: 'ignore',
            reason: 'relative_reference_context',
          };
    }

    if (this.hasCasualReferenceContext(original, normalized)) {
      return {
        decision: 'ignore',
        reason: 'casual_reference',
      };
    }

    if (this.hasExplicitAction(normalized)) {
      return {
        decision: 'execute',
        reason: 'explicit_action',
      };
    }

    const directCommand = this.parser.parse(normalizedTranscription);
    const isDirectReference =
      directCommand.type === CommandType.BIBLE_REFERENCE;

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

  private hasExplicitAction(value: string): boolean {
    return /^(?:agora\s+vamos\s+para|vamos\s+para|abra(?:\s+em)?|mostre|coloque|projete|vamos\s+ler|agora\s+em)\b/.test(
      value,
    );
  }

  private hasCasualReferenceContext(
    original: string,
    normalized: string,
  ): boolean {
    return (
      /^(?:como\s+(?:vimos|esta)|isso\s+tambem\s+aparece|segundo\b|la\s+em\b)/.test(
        original,
      ) ||
      /^(?:como\s+(?:vimos|esta)|isso\s+tambem\s+aparece|la\s+em\b)/.test(
        normalized,
      ) ||
      /^(?:em|no|na)\b.*\b(?:vemos|temos|aparece)\b/.test(
        normalized,
      )
    );
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
