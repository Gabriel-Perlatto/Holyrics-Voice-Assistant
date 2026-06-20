import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  BibleBook,
  BibleBooksResponse,
  BibleChaptersResponse,
  BibleVersesResponse,
  BibleVersionsResponse,
} from '../interfaces/bible-content.interface';
import {
  BIBLE_CONTENT_PROVIDER,
  type BibleContentProvider,
} from '../interfaces/bible-content-provider.interface';
import { BibleContextService } from './bible-context.service';
import { BookAliasService } from './book-alias.service';

@Injectable()
export class BibleService {
  constructor(
    @Inject(BIBLE_CONTENT_PROVIDER)
    private readonly contentProvider: BibleContentProvider,
    private readonly aliasService: BookAliasService,
    private readonly contextService: BibleContextService,
  ) {}

  getVersions(): BibleVersionsResponse {
    return {
      source: this.contentProvider.source,
      fallback: true,
      currentVersionId: this.contextService.getContext().versionId,
      items: this.contentProvider.listVersions(),
    };
  }

  getBooks(): BibleBooksResponse {
    return {
      source: this.contentProvider.source,
      fallback: true,
      items: this.contentProvider.listBooks(),
    };
  }

  getChapters(bookIdentifier: string): BibleChaptersResponse {
    const book = this.resolveBook(bookIdentifier);

    return {
      source: this.contentProvider.source,
      fallback: true,
      book,
      items: this.contentProvider.listChapters(book.id),
    };
  }

  getVerses(
    bookIdentifier: string,
    chapterValue: string,
  ): BibleVersesResponse {
    const book = this.resolveBook(bookIdentifier);
    const chapter = this.parseChapter(chapterValue);
    const chapters = this.contentProvider.listChapters(book.id);

    if (!chapters.some(({ number }) => number === chapter)) {
      throw new NotFoundException(
        `O capítulo ${chapter} não existe no livro ${book.name}.`,
      );
    }

    return {
      source: this.contentProvider.source,
      fallback: true,
      book,
      chapter,
      currentVersionId: this.contextService.getContext().versionId,
      contentAvailable: false,
      items: this.contentProvider.listVerses(book.id, chapter),
    };
  }

  private resolveBook(identifier: string): BibleBook {
    const aliasedBook = this.aliasService.resolve(identifier);
    const book = aliasedBook
      ? this.contentProvider.findBook(aliasedBook.id)
      : undefined;

    if (!book) {
      throw new NotFoundException(
        `Livro bíblico não encontrado: ${identifier}.`,
      );
    }

    return book;
  }

  private parseChapter(value: string): number {
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException(
        'O capítulo deve ser informado como um número inteiro positivo.',
      );
    }

    const chapter = Number(value);

    if (!Number.isSafeInteger(chapter) || chapter < 1) {
      throw new BadRequestException(
        'O capítulo deve ser informado como um número inteiro positivo.',
      );
    }

    return chapter;
  }
}
