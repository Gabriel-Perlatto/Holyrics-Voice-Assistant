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

const EMBEDDED_NAVIGATION_COMMANDS = [
  ...EXACT_COMMANDS.entries(),
]
  .filter(([expression]) => expression.includes(' '))
  .sort(
    ([left], [right]) => right.length - left.length,
  );

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

  parseTranscription(input: unknown): StructuredCommand {
    const strictCommand = this.parse(input);

    if (strictCommand.type !== CommandType.UNKNOWN) {
      return strictCommand;
    }

    if (typeof input !== 'string') {
      return strictCommand;
    }

    const normalized = this.normalize(input);
    const embeddedReference =
      this.parseEmbeddedBibleReference(normalized);

    if (embeddedReference) {
      return embeddedReference;
    }

    const navigationText =
      this.normalizeNavigationCommand(normalized);

    for (const [expression, type] of EMBEDDED_NAVIGATION_COMMANDS) {
      if (
        new RegExp(`(?:^| )${expression}(?: |$)`).test(
          navigationText,
        )
      ) {
        return { type };
      }
    }

    return strictCommand;
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

      if (!reference) {
        return {
          type: CommandType.BIBLE_REFERENCE,
          book: entry.book,
          chapter: null,
          verse: null,
        };
      }

      const chapterMatch = /^(?:capitulo )?(\d{1,3})$/.exec(reference);

      if (chapterMatch) {
        const chapter = Number(chapterMatch[1]);

        if (!this.isValidChapter(entry.bookIndex, chapter)) {
          return null;
        }

        return {
          type: CommandType.BIBLE_REFERENCE,
          book: entry.book,
          chapter,
          verse: 1,
        };
      }

      const completeMatch =
        /^(?:capitulo )?(\d{1,3}) (?:versiculo )?(\d{1,3})$/.exec(
          reference,
        );

      if (!completeMatch) {
        continue;
      }

      const chapter = Number(completeMatch[1]);
      const verse = Number(completeMatch[2]);

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

  private parseEmbeddedBibleReference(
    normalized: string,
  ): StructuredCommand | null {
    for (const entry of this.aliases) {
      let offset = normalized.indexOf(entry.alias);

      while (offset >= 0) {
        const before = normalized[offset - 1];
        const after = normalized[offset + entry.alias.length];
        const hasBoundaryBefore =
          offset === 0 || before === ' ';
        const hasBoundaryAfter =
          after === undefined || after === ' ';

        if (hasBoundaryBefore && hasBoundaryAfter) {
          const tail = this.normalizeNavigationCommand(
            normalized
              .slice(offset + entry.alias.length)
              .trim(),
          );
          const referenceMatch =
            /^(?:capitulo )?(\d{1,3})(?: (?:versiculo )?(\d{1,3}))?/.exec(
              tail,
            );

          if (referenceMatch) {
            const chapter = Number(referenceMatch[1]);
            const verse = referenceMatch[2]
              ? Number(referenceMatch[2])
              : 1;

            if (
              this.isValidReference(
                entry.bookIndex,
                chapter,
                verse,
              )
            ) {
              return {
                type: CommandType.BIBLE_REFERENCE,
                book: entry.book,
                chapter,
                verse,
              };
            }
          } else if (!tail) {
            return {
              type: CommandType.BIBLE_REFERENCE,
              book: entry.book,
              chapter: null,
              verse: null,
            };
          }
        }

        offset = normalized.indexOf(
          entry.alias,
          offset + entry.alias.length,
        );
      }
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
      this.isValidChapter(bookIndex, chapter) &&
      Number.isInteger(verse) &&
      verse > 0 &&
      typeof verseCount === 'number' &&
      verse <= verseCount
    );
  }

  private isValidChapter(
    bookIndex: number,
    chapter: number,
  ): boolean {
    const chapters = BIBLE_VERSE_COUNTS[bookIndex];

    return (
      Number.isInteger(chapter) &&
      chapter > 0 &&
      Array.isArray(chapters) &&
      chapter <= chapters.length
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
