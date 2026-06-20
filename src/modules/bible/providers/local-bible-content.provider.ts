import { Injectable } from '@nestjs/common';
import { PT_BR_BIBLE_BOOKS } from '../data/pt-BR/books';
import { LOCAL_BIBLE_VERSIONS } from '../data/versions';
import { BIBLE_VERSE_COUNTS } from '../data/verse-counts';
import type {
  BibleBook,
  BibleChapter,
  BibleDataSource,
  BibleVerse,
  BibleVersion,
} from '../interfaces/bible-content.interface';
import type { BibleContentProvider } from '../interfaces/bible-content-provider.interface';

@Injectable()
export class LocalBibleContentProvider implements BibleContentProvider {
  readonly source: BibleDataSource = 'local-fallback';

  listVersions(): BibleVersion[] {
    return LOCAL_BIBLE_VERSIONS.map((version) => ({ ...version }));
  }

  listBooks(): BibleBook[] {
    return PT_BR_BIBLE_BOOKS.map((book) => ({
      ...book,
      aliases: [...book.aliases],
    }));
  }

  findBook(bookId: string): BibleBook | undefined {
    const book = PT_BR_BIBLE_BOOKS.find(({ id }) => id === bookId);

    return book ? { ...book, aliases: [...book.aliases] } : undefined;
  }

  listChapters(bookId: string): BibleChapter[] {
    const bookIndex = PT_BR_BIBLE_BOOKS.findIndex(({ id }) => id === bookId);

    if (bookIndex < 0) {
      return [];
    }

    return BIBLE_VERSE_COUNTS[bookIndex].map((verseCount, index) => ({
      number: index + 1,
      verseCount,
    }));
  }

  listVerses(bookId: string, chapter: number): BibleVerse[] {
    const chapterData = this.listChapters(bookId).find(
      ({ number }) => number === chapter,
    );

    if (!chapterData) {
      return [];
    }

    return Array.from(
      { length: chapterData.verseCount },
      (_, index) => ({ number: index + 1 }),
    );
  }
}
