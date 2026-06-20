export type BibleTestament = 'old' | 'new';
export type BibleDataSource = 'local-fallback';

export interface BibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  contentAvailable: false;
}

export interface BibleBook {
  id: string;
  name: string;
  abbreviation: string;
  testament: BibleTestament;
  aliases: string[];
  chapterCount: number;
}

export interface BibleChapter {
  number: number;
  verseCount: number;
}

export interface BibleVerse {
  number: number;
}

export interface BibleContext {
  versionId: string;
  bookId: string | null;
  chapter: number | null;
  verse: number | null;
}

export interface BibleSelection {
  versionId: string;
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  reference: string;
}

export interface BibleSelectionResponse {
  accepted: true;
  delivery: 'holyrics' | 'local-only' | 'failed';
  deliveredToHolyrics: boolean;
  message: string;
  deliveryError: string | null;
  selection: BibleSelection;
  selectedAt: string;
}

export interface BibleCollectionResponse<T> {
  source: BibleDataSource;
  fallback: true;
  items: T[];
}

export interface BibleVersionsResponse
  extends BibleCollectionResponse<BibleVersion> {
  currentVersionId: string;
}

export interface BibleBooksResponse
  extends BibleCollectionResponse<BibleBook> {}

export interface BibleChaptersResponse
  extends BibleCollectionResponse<BibleChapter> {
  book: BibleBook;
}

export interface BibleVersesResponse
  extends BibleCollectionResponse<BibleVerse> {
  book: BibleBook;
  chapter: number;
  currentVersionId: string;
  contentAvailable: false;
}
