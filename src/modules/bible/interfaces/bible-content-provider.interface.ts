import type {
  BibleBook,
  BibleChapter,
  BibleDataSource,
  BibleVerse,
  BibleVersion,
} from './bible-content.interface';

export interface BibleContentProvider {
  readonly source: BibleDataSource;
  listVersions(): BibleVersion[];
  listBooks(): BibleBook[];
  findBook(bookId: string): BibleBook | undefined;
  listChapters(bookId: string): BibleChapter[];
  listVerses(bookId: string, chapter: number): BibleVerse[];
}

export const BIBLE_CONTENT_PROVIDER = Symbol('BIBLE_CONTENT_PROVIDER');
