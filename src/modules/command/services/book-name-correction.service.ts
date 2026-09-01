import { Injectable } from '@nestjs/common';
import { PT_BR_BIBLE_BOOKS } from '../../bible/data/pt-BR/books';

interface TextWord {
  value: string;
  start: number;
  end: number;
}

const MINIMUM_WORD_LENGTH = 4;

/**
 * Corrige nomes de livros bíblicos transcritos com pequenos desvios pelo
 * Vosk (ex.: "apocaliste" em vez de "apocalipse").
 *
 * O vocabulário vem exclusivamente de `book.id` — o identificador estável,
 * sempre sem acento, que o `PtBrCommandParser` já aceita como alias válido
 * para todo livro. Nenhuma lista bíblica é duplicada.
 *
 * Diferente do `TranscriptionCorrectionService` (palavras-chave), este
 * serviço é deliberadamente mais conservador: livros com nomes parecidos
 * (ex.: "Atos" e "Amós") tornam uma correção errada mais visível e mais cara
 * de acontecer ao vivo do que simplesmente não reconhecer o comando. Por
 * isso a distância aceita é menor, uma palavra ambígua (equidistante de dois
 * livros) nunca é corrigida, e a correção só é tentada quando a palavra é
 * seguida por um número — como uma referência bíblica real quase sempre é
 * ("apocaliste 12", "2 petro 1"). Sem essa checagem, palavras comuns do
 * português colidem com nomes curtos de livros (ex.: "vamos" fica a uma
 * edição de distância de "Amós", "perdão" de "Pedro"); exigir um número logo
 * depois evita corrigir essas palavras no meio de uma frase comum.
 */
@Injectable()
export class BookNameCorrectionService {
  private readonly vocabulary = this.buildVocabulary();

  correct(input: unknown): string {
    if (typeof input !== 'string' || input.length === 0) {
      return typeof input === 'string' ? input : '';
    }

    const words = this.extractWords(input);
    let output = '';
    let cursor = 0;

    for (const word of words) {
      const correction = this.isFollowedByNumber(input, word)
        ? this.findCorrection(word.value)
        : null;

      if (correction) {
        output += input.slice(cursor, word.start);
        output += correction;
        cursor = word.end;
      }
    }

    return output + input.slice(cursor);
  }

  private isFollowedByNumber(input: string, word: TextWord): boolean {
    return /^\s*\d/.test(input.slice(word.end));
  }

  private findCorrection(word: string): string | null {
    const normalized = this.normalize(word);

    if (
      normalized.length < MINIMUM_WORD_LENGTH ||
      this.vocabulary.has(normalized)
    ) {
      return null;
    }

    const maxDistance = normalized.length <= 5 ? 1 : 2;
    let bestMatch: string | null = null;
    let bestDistance = Infinity;
    let ties = 0;

    for (const candidate of this.vocabulary) {
      const distance = this.levenshtein(normalized, candidate);

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

  private buildVocabulary(): Set<string> {
    const words = new Set<string>();

    for (const book of PT_BR_BIBLE_BOOKS) {
      for (const segment of book.id.split('-')) {
        if (/^\d+$/.test(segment)) {
          continue;
        }

        const normalized = this.normalize(segment);

        if (normalized.length >= MINIMUM_WORD_LENGTH) {
          words.add(normalized);
        }
      }
    }

    return words;
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
