import { Injectable } from '@nestjs/common';
import { PT_BR_BIBLE_BOOKS } from '../../bible/data/pt-BR/books';
import { BIBLE_VERSE_COUNTS } from '../../bible/data/verse-counts';
import { CommandType } from '../enums/command-type.enum';
import type {
  NavigationCommand,
  StructuredCommand,
} from '../interfaces/command.interface';

interface BookAliasEntry {
  alias: string;
  book: string;
  bookIndex: number;
}

const EXACT_COMMANDS = new Map<
  string,
  NavigationCommand['type']
>([
  ['proximo', CommandType.NEXT_VERSE],
  ['proximo versiculo', CommandType.NEXT_VERSE],
  ['versiculo seguinte', CommandType.NEXT_VERSE],
  ['anterior', CommandType.PREVIOUS_VERSE],
  ['voltar', CommandType.PREVIOUS_VERSE],
  ['versiculo anterior', CommandType.PREVIOUS_VERSE],
  ['proximo capitulo', CommandType.NEXT_CHAPTER],
  ['capitulo seguinte', CommandType.NEXT_CHAPTER],
  ['capitulo anterior', CommandType.PREVIOUS_CHAPTER],
]);

@Injectable()
export class PtBrCommandParser {
  private readonly aliases: BookAliasEntry[];

  constructor() {
    const aliases = new Map<string, BookAliasEntry>();

    PT_BR_BIBLE_BOOKS.forEach((book, bookIndex) => {
      for (const identifier of [
        book.id,
        book.name,
        book.abbreviation,
        ...book.aliases,
      ]) {
        const alias = this.normalize(identifier);
        aliases.set(alias, { alias, book: book.id, bookIndex });
      }
    });

    this.aliases = [...aliases.values()].sort(
      (left, right) => right.alias.length - left.alias.length,
    );
  }

  parse(input: unknown): StructuredCommand {
    if (typeof input !== 'string') {
      return { type: CommandType.UNKNOWN };
    }

    const normalized = this.normalize(input);

    if (!normalized) {
      return { type: CommandType.UNKNOWN };
    }

    const exactCommand = EXACT_COMMANDS.get(
      this.normalizeNavigationCommand(normalized),
    );

    if (exactCommand) {
      return { type: exactCommand };
    }

    return (
      this.parseBibleReference(normalized) ?? {
        type: CommandType.UNKNOWN,
      }
    );
  }

  private parseBibleReference(
    normalized: string,
  ): StructuredCommand | null {
    for (const entry of this.aliases) {
      if (
        normalized !== entry.alias &&
        !normalized.startsWith(`${entry.alias} `)
      ) {
        continue;
      }

      const reference = this.normalizeNavigationCommand(
        normalized.slice(entry.alias.length).trim(),
      );
      const match =
        /^(?:capitulo )?(\d{1,3}) (?:versiculo )?(\d{1,3})$/.exec(
          reference,
        );

      if (!match) {
        continue;
      }

      const chapter = Number(match[1]);
      const verse = Number(match[2]);

      if (!this.isValidReference(entry.bookIndex, chapter, verse)) {
        return null;
      }

      return {
        type: CommandType.BIBLE_REFERENCE,
        book: entry.book,
        chapter,
        verse,
      };
    }

    return null;
  }

  private isValidReference(
    bookIndex: number,
    chapter: number,
    verse: number,
  ): boolean {
    const chapters = BIBLE_VERSE_COUNTS[bookIndex];
    const verseCount = chapters?.[chapter - 1];

    return (
      Number.isInteger(chapter) &&
      Number.isInteger(verse) &&
      chapter > 0 &&
      verse > 0 &&
      typeof verseCount === 'number' &&
      verse <= verseCount
    );
  }

  private normalize(value: string): string {
    return value
      .toLocaleLowerCase('pt-BR')
      .replace(/[.:,;_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeNavigationCommand(value: string): string {
    return value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
  }
}
