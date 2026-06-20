import { Injectable } from '@nestjs/common';

interface TextWord {
  value: string;
  normalized: string;
  start: number;
  end: number;
}

const SIMPLE_CARDINALS = new Map<string, number>([
  ['zero', 0],
  ['um', 1],
  ['uma', 1],
  ['dois', 2],
  ['duas', 2],
  ['três', 3],
  ['tres', 3],
  ['quatro', 4],
  ['cinco', 5],
  ['seis', 6],
  ['sete', 7],
  ['oito', 8],
  ['nove', 9],
  ['dez', 10],
  ['onze', 11],
  ['doze', 12],
  ['treze', 13],
  ['catorze', 14],
  ['quatorze', 14],
  ['quinze', 15],
  ['dezesseis', 16],
  ['dezasseis', 16],
  ['dezessete', 17],
  ['dezassete', 17],
  ['dezoito', 18],
  ['dezenove', 19],
  ['dezanove', 19],
]);

const TENS = new Map<string, number>([
  ['vinte', 20],
  ['trinta', 30],
  ['quarenta', 40],
  ['cinquenta', 50],
  ['sessenta', 60],
  ['setenta', 70],
  ['oitenta', 80],
  ['noventa', 90],
]);

const ORDINALS = new Map<string, number>([
  ['primeiro', 1],
  ['primeira', 1],
  ['segundo', 2],
  ['segunda', 2],
  ['terceiro', 3],
  ['terceira', 3],
  ['quarto', 4],
  ['quarta', 4],
  ['quinto', 5],
  ['quinta', 5],
  ['sexto', 6],
  ['sexta', 6],
  ['sétimo', 7],
  ['setimo', 7],
  ['sétima', 7],
  ['setima', 7],
  ['oitavo', 8],
  ['oitava', 8],
  ['nono', 9],
  ['nona', 9],
  ['décimo', 10],
  ['decimo', 10],
  ['décima', 10],
  ['decima', 10],
]);

const MAX_NUMBER_WORDS = 5;

@Injectable()
export class NumberNormalizerService {
  normalize(input: unknown): string {
    if (typeof input !== 'string' || input.length === 0) {
      return typeof input === 'string' ? input : '';
    }

    const words = this.extractWords(input);

    if (words.length === 0) {
      return input;
    }

    const replacements: Array<{
      start: number;
      end: number;
      value: string;
    }> = [];

    for (let index = 0; index < words.length; ) {
      if (this.isNegativeNumber(words, index, input)) {
        index += 1;
        continue;
      }

      const unsupportedEndIndex = this.findUnsupportedNumberEnd(
        words,
        index,
        input,
      );

      if (unsupportedEndIndex !== null) {
        index = unsupportedEndIndex + 1;
        continue;
      }

      const match = this.findLongestNumber(words, index, input);

      if (!match) {
        index += 1;
        continue;
      }

      replacements.push({
        start: words[index].start,
        end: words[match.endIndex].end,
        value: String(match.value),
      });
      index = match.endIndex + 1;
    }

    if (replacements.length === 0) {
      return input;
    }

    let output = '';
    let cursor = 0;

    for (const replacement of replacements) {
      output += input.slice(cursor, replacement.start);
      output += replacement.value;
      cursor = replacement.end;
    }

    return output + input.slice(cursor);
  }

  private findLongestNumber(
    words: TextWord[],
    startIndex: number,
    input: string,
  ): { value: number; endIndex: number } | null {
    const maximumEnd = Math.min(
      words.length - 1,
      startIndex + MAX_NUMBER_WORDS - 1,
    );

    for (let endIndex = maximumEnd; endIndex >= startIndex; endIndex -= 1) {
      if (!this.hasOnlyWhitespaceBetween(words, startIndex, endIndex, input)) {
        continue;
      }

      const tokens = words
        .slice(startIndex, endIndex + 1)
        .map((word) => word.normalized);
      const value = this.parseNumberTokens(tokens);

      if (value !== null) {
        return { value, endIndex };
      }
    }

    return null;
  }

  private parseNumberTokens(tokens: string[]): number | null {
    if (tokens.length === 1) {
      const token = tokens[0];
      return (
        ORDINALS.get(token) ??
        SIMPLE_CARDINALS.get(token) ??
        TENS.get(token) ??
        (token === 'cem' || token === 'cento' ? 100 : null)
      );
    }

    if (tokens[0] === 'cento') {
      const remainderTokens =
        tokens[1] === 'e' ? tokens.slice(2) : tokens.slice(1);
      const remainder = this.parseBelowOneHundred(remainderTokens);
      const value = remainder === null ? null : 100 + remainder;

      return value !== null && value <= 150 ? value : null;
    }

    return this.parseBelowOneHundred(tokens);
  }

  private parseBelowOneHundred(tokens: string[]): number | null {
    if (tokens.length === 1) {
      return SIMPLE_CARDINALS.get(tokens[0]) ?? TENS.get(tokens[0]) ?? null;
    }

    if (tokens.length !== 3 || tokens[1] !== 'e') {
      return null;
    }

    const tens = TENS.get(tokens[0]);
    const unit = SIMPLE_CARDINALS.get(tokens[2]);

    if (
      tens === undefined ||
      unit === undefined ||
      unit < 1 ||
      unit > 9
    ) {
      return null;
    }

    return tens + unit;
  }

  private findUnsupportedNumberEnd(
    words: TextWord[],
    startIndex: number,
    input: string,
  ): number | null {
    if (words[startIndex].normalized !== 'cento') {
      return null;
    }

    let endIndex = startIndex;

    while (
      endIndex + 1 < words.length &&
      endIndex - startIndex + 1 < MAX_NUMBER_WORDS &&
      this.hasOnlyWhitespaceBetween(
        words,
        endIndex,
        endIndex + 1,
        input,
      ) &&
      this.isCardinalToken(words[endIndex + 1].normalized)
    ) {
      endIndex += 1;
    }

    const tokens = words
      .slice(startIndex, endIndex + 1)
      .map((word) => word.normalized);
    const remainderTokens =
      tokens[1] === 'e' ? tokens.slice(2) : tokens.slice(1);
    const remainder = this.parseBelowOneHundred(remainderTokens);

    return remainder !== null && 100 + remainder > 150
      ? endIndex
      : null;
  }

  private isCardinalToken(token: string): boolean {
    return (
      token === 'e' ||
      SIMPLE_CARDINALS.has(token) ||
      TENS.has(token)
    );
  }

  private isNegativeNumber(
    words: TextWord[],
    index: number,
    input: string,
  ): boolean {
    return (
      index > 0 &&
      words[index - 1].normalized === 'menos' &&
      this.hasOnlyWhitespaceBetween(words, index - 1, index, input)
    );
  }

  private extractWords(input: string): TextWord[] {
    return [...input.matchAll(/\p{L}+/gu)].map((match) => ({
      value: match[0],
      normalized: match[0].toLocaleLowerCase('pt-BR'),
      start: match.index,
      end: match.index + match[0].length,
    }));
  }

  private hasOnlyWhitespaceBetween(
    words: TextWord[],
    startIndex: number,
    endIndex: number,
    input: string,
  ): boolean {
    for (let index = startIndex; index < endIndex; index += 1) {
      const separator = input.slice(words[index].end, words[index + 1].start);

      if (!/^\s+$/.test(separator)) {
        return false;
      }
    }

    return true;
  }
}
