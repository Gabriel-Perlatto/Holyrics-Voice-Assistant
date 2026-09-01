import { Injectable } from '@nestjs/common';

interface TextWord {
  value: string;
  start: number;
  end: number;
}

/**
 * Palavras conhecidas por serem confundidas pelo Vosk em testes reais.
 * Diferente de distância de edição genérica, este mapa é auditável e cresce
 * por observação direta: quando um novo caso aparecer, basta adicionar uma
 * linha aqui.
 */
const KNOWN_CONFUSIONS = new Map<string, string>([
  ['capeta', 'capitulo'],
  ['capiculo', 'capitulo'],
  ['capitolo', 'capitulo'],
]);

/**
 * Vocabulário fechado relevante para o parser e para os sinais de intenção.
 * Nomes de livros ficam de fora de propósito: são muitos, com maior risco de
 * correção incorreta entre livros parecidos.
 */
const VOCABULARY = [
  'capitulo',
  'versiculo',
  'proximo',
  'anterior',
  'seguinte',
  'vamos',
  'para',
  'pra',
  'parar',
  'ler',
  'abrir',
  'trabalhar',
  'caminhar',
  'abra',
  'abre',
  'mostre',
  'mostra',
  'coloque',
  'coloca',
  'poe',
  'bota',
  'bote',
  'projete',
  'projeta',
  'volta',
  'voltar',
  'retorna',
  'acompanhe',
  'acompanha',
  'agora',
  'veja',
  'olha',
  'comigo',
  'leia',
  'leva',
  'tela',
  'telao',
  'como',
  'vimos',
  'esta',
  'tambem',
  'aparece',
  'segundo',
  'temos',
  'mesma',
  'informacao',
  'logica',
  'nao',
  'sem',
];

const MINIMUM_WORD_LENGTH = 3;

@Injectable()
export class TranscriptionCorrectionService {
  correct(input: unknown): string {
    if (typeof input !== 'string' || input.length === 0) {
      return typeof input === 'string' ? input : '';
    }

    const words = this.extractWords(input);
    let output = '';
    let cursor = 0;

    for (const word of words) {
      const correction = this.findCorrection(word.value);

      if (correction) {
        output += input.slice(cursor, word.start);
        output += correction;
        cursor = word.end;
      }
    }

    return output + input.slice(cursor);
  }

  private findCorrection(word: string): string | null {
    const normalized = this.normalize(word);

    if (normalized.length < MINIMUM_WORD_LENGTH) {
      return null;
    }

    const known = KNOWN_CONFUSIONS.get(normalized);

    if (known) {
      return known;
    }

    if (VOCABULARY.includes(normalized)) {
      return null;
    }

    return this.findClosestVocabularyWord(normalized);
  }

  private findClosestVocabularyWord(word: string): string | null {
    const maxDistance = word.length <= 5 ? 1 : 2;
    let bestMatch: string | null = null;
    let bestDistance = Infinity;
    let ties = 0;

    for (const candidate of VOCABULARY) {
      const distance = this.levenshtein(word, candidate);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = candidate;
        ties = 1;
      } else if (distance === bestDistance) {
        ties += 1;
      }
    }

    return bestMatch !== null && bestDistance <= maxDistance && ties === 1
      ? bestMatch
      : null;
  }

  private normalize(value: string): string {
    return value
      .toLocaleLowerCase('pt-BR')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
  }

  private levenshtein(left: string, right: string): number {
    const rows = left.length + 1;
    const columns = right.length + 1;
    const matrix: number[][] = Array.from({ length: rows }, () =>
      new Array<number>(columns).fill(0),
    );

    for (let row = 0; row < rows; row += 1) {
      matrix[row][0] = row;
    }

    for (let column = 0; column < columns; column += 1) {
      matrix[0][column] = column;
    }

    for (let row = 1; row < rows; row += 1) {
      for (let column = 1; column < columns; column += 1) {
        const cost = left[row - 1] === right[column - 1] ? 0 : 1;

        matrix[row][column] = Math.min(
          matrix[row - 1][column] + 1,
          matrix[row][column - 1] + 1,
          matrix[row - 1][column - 1] + cost,
        );
      }
    }

    return matrix[rows - 1][columns - 1];
  }

  private extractWords(input: string): TextWord[] {
    return [...input.matchAll(/\p{L}+/gu)].map((match) => ({
      value: match[0],
      start: match.index as number,
      end: (match.index as number) + match[0].length,
    }));
  }
}
