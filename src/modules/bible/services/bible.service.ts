import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RealtimeEventType } from '../../realtime/enums/realtime-event-type.enum';
import { RealtimeService } from '../../realtime/services/realtime.service';
import type {
  BibleBook,
  BibleBooksResponse,
  BibleChaptersResponse,
  BibleSelectionResponse,
  BibleVersesResponse,
  BibleVersionsResponse,
} from '../interfaces/bible-content.interface';
import type { SelectBiblePassageDto } from '../dto/select-bible-passage.dto';
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
    private readonly realtimeService: RealtimeService,
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

  selectPassage(input: SelectBiblePassageDto): BibleSelectionResponse {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new BadRequestException('Seleção bíblica inválida.');
    }

    const versionId = this.validateVersion(input.versionId);
    const bookId = this.validateRequiredText(input.bookId, 'livro');
    const chapter = this.validatePositiveInteger(input.chapter, 'capítulo');
    const verse = this.validatePositiveInteger(input.verse, 'versículo');
    const book = this.resolveBook(bookId);
    const verses = this.contentProvider.listVerses(book.id, chapter);

    if (!verses.length) {
      throw new NotFoundException(
        `O capítulo ${chapter} não existe no livro ${book.name}.`,
      );
    }

    if (!verses.some(({ number }) => number === verse)) {
      throw new NotFoundException(
        `O versículo ${verse} não existe em ${book.name} ${chapter}.`,
      );
    }

    this.contextService.selectPassage({
      versionId,
      bookId: book.id,
      chapter,
      verse,
    });

    const response: BibleSelectionResponse = {
      accepted: true,
      delivery: 'local-only',
      deliveredToHolyrics: false,
      message:
        'Passagem selecionada localmente. O envio ao Holyrics ainda não possui endpoint oficial confirmado.',
      selection: {
        versionId,
        bookId: book.id,
        bookName: book.name,
        chapter,
        verse,
        reference: `${book.name} ${chapter}:${verse}`,
      },
      selectedAt: new Date().toISOString(),
    };

    this.realtimeService.emit(RealtimeEventType.BIBLE_CHANGED, {
      book: {
        id: response.selection.bookId,
        name: response.selection.bookName,
      },
      chapter: response.selection.chapter,
      verse: response.selection.verse,
      version: response.selection.versionId,
      source: 'local-fallback',
      delivery: response.delivery,
      deliveredToHolyrics: response.deliveredToHolyrics,
    });

    return response;
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

  private validateVersion(value: unknown): string {
    const versionId = this.validateRequiredText(value, 'versão');
    const versionExists = this.contentProvider
      .listVersions()
      .some(({ id }) => id === versionId);

    if (!versionExists) {
      throw new NotFoundException(
        `Versão bíblica não encontrada: ${versionId}.`,
      );
    }

    return versionId;
  }

  private validateRequiredText(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(
        `Informe ${field} para selecionar a passagem.`,
      );
    }

    return value.trim();
  }

  private validatePositiveInteger(value: unknown, field: string): number {
    if (
      typeof value !== 'number' ||
      !Number.isSafeInteger(value) ||
      value < 1
    ) {
      throw new BadRequestException(
        `O ${field} deve ser um número inteiro positivo.`,
      );
    }

    return value;
  }
}
