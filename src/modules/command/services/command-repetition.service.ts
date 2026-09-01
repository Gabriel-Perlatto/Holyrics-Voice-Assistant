import { Injectable } from '@nestjs/common';
import type { BibleReferenceCommand } from '../interfaces/command.interface';

interface IgnoredReference {
  book: string;
  chapter: number | null;
  verse: number | null;
  at: number;
}

/**
 * Quando o pregador tenta navegar e o sistema não reconhece a ação (falta um
 * verbo de ação, ex.: "Apocalipse 12 13" sozinho no modo conservador), o
 * comportamento natural é repetir a mesma referência. Essa repetição vira uma
 * confirmação implícita: a segunda vez executa, mesmo sem gatilho.
 */
const REPETITION_WINDOW_MS = 8000;

@Injectable()
export class CommandRepetitionService {
  private lastIgnored: IgnoredReference | null = null;

  isRepetition(command: BibleReferenceCommand): boolean {
    if (!this.lastIgnored) {
      return false;
    }

    const withinWindow =
      Date.now() - this.lastIgnored.at <= REPETITION_WINDOW_MS;

    return withinWindow && this.matches(this.lastIgnored, command);
  }

  rememberIgnored(command: BibleReferenceCommand): void {
    this.lastIgnored = {
      book: command.book,
      chapter: command.chapter,
      verse: command.verse,
      at: Date.now(),
    };
  }

  clear(): void {
    this.lastIgnored = null;
  }

  private matches(
    previous: IgnoredReference,
    current: BibleReferenceCommand,
  ): boolean {
    if (previous.book !== current.book) {
      return false;
    }

    if (previous.chapter !== null && previous.chapter !== current.chapter) {
      return false;
    }

    if (previous.verse === current.verse) {
      return true;
    }

    // Refinamento: primeiro só capítulo ("Apocalipse 12", versículo 1
    // assumido pelo parser), depois o versículo específico dentro do mesmo
    // capítulo ("Apocalipse 12 13").
    return previous.verse === 1 && current.chapter === previous.chapter;
  }
}
