import { Inject, Injectable } from '@nestjs/common';
import { CommandType } from '../../command/enums/command-type.enum';
import type { IdentifiedCommand } from '../../command/interfaces/command.interface';
import { HolyricsBibleProjectionService } from '../../holyrics/services/holyrics-bible-projection.service';
import { RealtimeEventType } from '../../realtime/enums/realtime-event-type.enum';
import { RealtimeService } from '../../realtime/services/realtime.service';
import {
  BIBLE_CONTENT_PROVIDER,
  type BibleContentProvider,
} from '../interfaces/bible-content-provider.interface';
import type {
  BibleBook,
  BibleContext,
} from '../interfaces/bible-content.interface';
import type { BibleNavigationStatus } from '../interfaces/bible-navigation.interface';
import { BibleContextService } from './bible-context.service';

interface ResolvedPassage {
  book: BibleBook;
  chapter: number;
  verse: number;
}

@Injectable()
export class BibleNavigationService {
  private lastAppliedCommand: IdentifiedCommand | null = null;

  constructor(
    @Inject(BIBLE_CONTENT_PROVIDER)
    private readonly contentProvider: BibleContentProvider,
    private readonly contextService: BibleContextService,
    private readonly realtimeService: RealtimeService,
    private readonly projectionService: HolyricsBibleProjectionService,
  ) {}

  async apply(
    command: IdentifiedCommand,
  ): Promise<BibleNavigationStatus> {
    const passage = this.resolveCommand(command);

    if (!passage) {
      return this.getStatus();
    }

    const currentContext = this.contextService.getContext();
    const nextContext: BibleContext = {
      versionId: currentContext.versionId,
      bookId: passage.book.id,
      chapter: passage.chapter,
      verse: passage.verse,
    };

    if (
      command.type !== CommandType.BIBLE_REFERENCE &&
      this.isSameContext(currentContext, nextContext)
    ) {
      return this.getStatus();
    }

    this.contextService.selectPassage(nextContext);
    this.lastAppliedCommand = { ...command };
    const version = this.contentProvider
      .listVersions()
      .find(({ id }) => id === nextContext.versionId);
    const versionName =
      version?.abbreviation ?? nextContext.versionId.toUpperCase();
    const projection = await this.projectionService.project({
      reference: `${passage.book.name} ${passage.chapter}:${passage.verse}`,
      version: versionName,
    });

    this.realtimeService.emit(RealtimeEventType.BIBLE_CHANGED, {
      book: passage.book.id,
      chapter: passage.chapter,
      verse: passage.verse,
      version: versionName,
      source: 'voice',
      delivery: projection.delivery,
      deliveredToHolyrics: projection.deliveredToHolyrics,
    });

    return this.getStatus();
  }

  getStatus(): BibleNavigationStatus {
    const context = this.contextService.getContext();

    return {
      context,
      currentReference: this.formatReference(context),
      lastAppliedCommand: this.lastAppliedCommand
        ? { ...this.lastAppliedCommand }
        : null,
    };
  }

  private resolveCommand(
    command: IdentifiedCommand,
  ): ResolvedPassage | null {
    if (command.type === CommandType.UNKNOWN) {
      return null;
    }

    if (command.type === CommandType.BIBLE_REFERENCE) {
      return this.resolveReference(
        command.book,
        command.chapter ?? 1,
        command.verse ?? 1,
      );
    }

    const current = this.resolveCurrentPassage();

    if (!current) {
      return null;
    }

    switch (command.type) {
      case CommandType.NEXT_VERSE:
        return this.nextVerse(current);
      case CommandType.PREVIOUS_VERSE:
        return this.previousVerse(current);
      case CommandType.NEXT_CHAPTER:
        return this.nextChapter(current);
      case CommandType.PREVIOUS_CHAPTER:
        return this.previousChapter(current);
    }
  }

  private resolveReference(
    bookId: string,
    chapter: number,
    verse: number,
  ): ResolvedPassage | null {
    const book = this.contentProvider.findBook(bookId);

    if (!book || !this.isValidPassage(book.id, chapter, verse)) {
      return null;
    }

    return { book, chapter, verse };
  }

  private resolveCurrentPassage(): ResolvedPassage | null {
    const context = this.contextService.getContext();

    if (
      !context.bookId ||
      context.chapter === null ||
      context.verse === null
    ) {
      return null;
    }

    return this.resolveReference(
      context.bookId,
      context.chapter,
      context.verse,
    );
  }

  private nextVerse(current: ResolvedPassage): ResolvedPassage {
    const verseCount = this.getVerseCount(
      current.book.id,
      current.chapter,
    );

    if (current.verse < verseCount) {
      return { ...current, verse: current.verse + 1 };
    }

    if (current.chapter < current.book.chapterCount) {
      return { ...current, chapter: current.chapter + 1, verse: 1 };
    }

    return this.firstPassageOfAdjacentBook(current.book.id, 1) ?? current;
  }

  private previousVerse(current: ResolvedPassage): ResolvedPassage {
    if (current.verse > 1) {
      return { ...current, verse: current.verse - 1 };
    }

    if (current.chapter > 1) {
      const chapter = current.chapter - 1;
      return {
        ...current,
        chapter,
        verse: this.getVerseCount(current.book.id, chapter),
      };
    }

    return this.lastPassageOfAdjacentBook(current.book.id, -1) ?? current;
  }

  private nextChapter(current: ResolvedPassage): ResolvedPassage {
    if (current.chapter < current.book.chapterCount) {
      return { ...current, chapter: current.chapter + 1, verse: 1 };
    }

    return this.firstPassageOfAdjacentBook(current.book.id, 1) ?? current;
  }

  private previousChapter(current: ResolvedPassage): ResolvedPassage {
    if (current.chapter > 1) {
      return { ...current, chapter: current.chapter - 1, verse: 1 };
    }

    const previousBook = this.getAdjacentBook(current.book.id, -1);

    return previousBook
      ? {
          book: previousBook,
          chapter: previousBook.chapterCount,
          verse: 1,
        }
      : current;
  }

  private firstPassageOfAdjacentBook(
    bookId: string,
    offset: number,
  ): ResolvedPassage | null {
    const book = this.getAdjacentBook(bookId, offset);
    return book ? { book, chapter: 1, verse: 1 } : null;
  }

  private lastPassageOfAdjacentBook(
    bookId: string,
    offset: number,
  ): ResolvedPassage | null {
    const book = this.getAdjacentBook(bookId, offset);

    if (!book) {
      return null;
    }

    const chapter = book.chapterCount;
    return {
      book,
      chapter,
      verse: this.getVerseCount(book.id, chapter),
    };
  }

  private getAdjacentBook(
    bookId: string,
    offset: number,
  ): BibleBook | null {
    const books = this.contentProvider.listBooks();
    const currentIndex = books.findIndex(({ id }) => id === bookId);
    return books[currentIndex + offset] ?? null;
  }

  private isValidPassage(
    bookId: string,
    chapter: number,
    verse: number,
  ): boolean {
    const chapters = this.contentProvider.listChapters(bookId);
    const chapterData = chapters.find(({ number }) => number === chapter);

    return (
      chapterData !== undefined &&
      Number.isInteger(verse) &&
      verse > 0 &&
      verse <= chapterData.verseCount
    );
  }

  private getVerseCount(bookId: string, chapter: number): number {
    return (
      this.contentProvider
        .listChapters(bookId)
        .find(({ number }) => number === chapter)?.verseCount ?? 0
    );
  }

  private formatReference(context: BibleContext): string | null {
    if (
      !context.bookId ||
      context.chapter === null ||
      context.verse === null
    ) {
      return null;
    }

    const book = this.contentProvider.findBook(context.bookId);
    return book
      ? `${book.name} ${context.chapter}:${context.verse} (${context.versionId.toUpperCase()})`
      : null;
  }

  private isSameContext(
    left: BibleContext,
    right: BibleContext,
  ): boolean {
    return (
      left.versionId === right.versionId &&
      left.bookId === right.bookId &&
      left.chapter === right.chapter &&
      left.verse === right.verse
    );
  }
}
