import { Injectable } from '@nestjs/common';
import { CommandType } from '../enums/command-type.enum';
import type { StructuredCommand } from '../interfaces/command.interface';

export interface CommandIntentSignal {
  decision: 'execute' | 'ignore';
  reason: 'explicit_action' | 'casual_reference';
}

/**
 * Marcadores de citação/menção casual. Presença de qualquer um destes
 * bloqueia a execução, independentemente de haver um verbo de ação.
 */
const CASUAL_MARKERS: RegExp[] = [
  /como vimos em/,
  /como esta em/,
  /isso tambem aparece em/,
  /\bla em\b/,
  /temos a mesma informacao/,
  /a logica e a mesma/,
  /quando falamos de/,
  /\blembra(m)? de\b/,
  /\blembrem de\b/,
  /quando a biblia fala em/,
  /quando paulo escreve em/,
  /na passagem de/,
  /aquele texto de/,
  /esse texto de/,
  /a historia de/,
  /faz referencia a/,
  /so para lembrar/,
  /apenas mencionando/,
  /o principio de/,
  /igual vimos em/,
  /da mesma forma em/,
  /quando eu citar/,
  /se eu falar de/,
];

/**
 * Verbos/expressões de ação que introduzem um comando explícito. Só contam
 * quando aparecem antes da referência (ver `getActionPrefix`); depois dela,
 * a mesma palavra costuma ser parte de uma frase narrativa
 * ("o versículo anterior mostra..."), não um comando.
 */
const ACTION_TRIGGERS: RegExp[] = [
  /\bvamos (para|pra|ao|a|parar|ler|abrir|voltar|trabalhar|caminhar)\b/,
  /\bva(i)? para\b/,
  /\bpassa para\b/,
  /\babr[ae]\b/,
  /\bmostr[ae]\b/,
  /\b(coloque|coloca|poe|bota|bote)\b/,
  /\bprojet[ae]\b/,
  /\bvolta para\b/,
  /\bretorna para\b/,
  /\bacompanh[ae]\b/,
  /\b(veja|olha) comigo\b/,
  /\bleia\b/,
  /\bagora em\b/,
  /\bleva\b.*\bpara\b/,
  /\b(tela|telao)\b/,
];

const NEGATION_WORDS = /\b(nao|sem)\b/;

/**
 * Palavras que marcam onde a referência começa. Usadas para restringir a
 * busca por verbos de ação ao trecho ANTES da referência.
 */
const REFERENCE_BOUNDARY_WORDS =
  /\b(proximo|anterior|seguinte|versiculo|capitulo)\b/;

@Injectable()
export class CommandIntentSignalsService {
  detect(
    normalized: string,
    command: StructuredCommand,
  ): CommandIntentSignal | null {
    if (this.matchesCasualMarker(normalized, command)) {
      return { decision: 'ignore', reason: 'casual_reference' };
    }

    const prefix = this.getActionPrefix(normalized);
    const hasTrigger = ACTION_TRIGGERS.some((pattern) =>
      pattern.test(prefix),
    );

    if (!hasTrigger) {
      return null;
    }

    if (NEGATION_WORDS.test(prefix)) {
      return { decision: 'ignore', reason: 'casual_reference' };
    }

    return { decision: 'execute', reason: 'explicit_action' };
  }

  private matchesCasualMarker(
    normalized: string,
    command: StructuredCommand,
  ): boolean {
    if (CASUAL_MARKERS.some((pattern) => pattern.test(normalized))) {
      return true;
    }

    // "segundo" (ordinal) costuma chegar aqui já normalizado para "2" pelo
    // NumberNormalizerService, mas o guard também pode receber o texto cru.
    // Uma referência que começa com "segundo"/"2" isolado, sem verbo de
    // ação, costuma ser "segundo <referência>" no sentido de "conforme" —
    // exceto quando o próprio livro bíblico começa com "2" (2 Pedro,
    // 2 João, 2 Samuel...).
    const isNumberedBookTwo =
      command.type === CommandType.BIBLE_REFERENCE &&
      command.book.startsWith('2-');
    const leadsWithSegundo =
      /^segundo\b/.test(normalized) || /^2\b/.test(normalized);

    return leadsWithSegundo && !isNumberedBookTwo;
  }

  private getActionPrefix(normalized: string): string {
    const digitMatch = /\d/.exec(normalized);
    const boundaryMatch = REFERENCE_BOUNDARY_WORDS.exec(normalized);
    const indices = [digitMatch?.index, boundaryMatch?.index].filter(
      (value): value is number => value !== undefined,
    );

    return indices.length
      ? normalized.slice(0, Math.min(...indices))
      : normalized;
  }
}
