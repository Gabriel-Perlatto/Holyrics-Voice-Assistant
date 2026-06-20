import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { RealtimeEventType } from '../../realtime/enums/realtime-event-type.enum';
import type { RealtimeService } from '../../realtime/services/realtime.service';
import type { HolyricsBibleProjectionService } from '../../holyrics/services/holyrics-bible-projection.service';
import { LocalBibleContentProvider } from '../providers/local-bible-content.provider';
import { BibleContextService } from './bible-context.service';
import { BibleService } from './bible.service';
import { BookAliasService } from './book-alias.service';

describe('BibleService', () => {
  const createRealtimeService = (): jest.Mocked<RealtimeService> =>
    ({
      emit: jest.fn(),
    }) as unknown as jest.Mocked<RealtimeService>;

  const createService = (
    realtimeService = createRealtimeService(),
    projectionService = {
      project: jest.fn(async () => ({
        reference: 'João 3:16',
        version: 'ACF',
        delivery: 'local-only' as const,
        deliveredToHolyrics: false,
        message: 'Somente local.',
        error: null,
        attemptedAt: '2026-06-20T00:00:00.000Z',
      })),
    } as unknown as jest.Mocked<HolyricsBibleProjectionService>,
  ) => ({
    realtimeService,
    projectionService,
    service: new BibleService(
      new LocalBibleContentProvider(),
      new BookAliasService(),
      new BibleContextService(),
      realtimeService,
      projectionService,
    ),
  });

  it('identifica claramente versões como fallback local', () => {
    const response = createService().service.getVersions();

    expect(response).toEqual(
      expect.objectContaining({
        source: 'local-fallback',
        fallback: true,
        currentVersionId: 'nvi',
      }),
    );
    expect(response.items).toHaveLength(4);
  });

  it('consulta capítulos por id ou alias pt-BR', () => {
    const service = createService().service;
    const byId = service.getChapters('joao');
    const byAlias = service.getChapters('Evangelho de João');

    expect(byId.book.id).toBe('joao');
    expect(byAlias.book.id).toBe('joao');
    expect(byAlias.items).toHaveLength(21);
  });

  it('consulta versículos e mantém a versão inicial no resultado', () => {
    const response = createService().service.getVerses('Jo', '3');

    expect(response).toEqual(
      expect.objectContaining({
        source: 'local-fallback',
        book: expect.objectContaining({ id: 'joao' }),
        chapter: 3,
        currentVersionId: 'nvi',
        contentAvailable: false,
      }),
    );
    expect(response.items).toHaveLength(36);
  });

  it('rejeita livro inexistente', () => {
    expect(() =>
      createService().service.getChapters('inexistente'),
    ).toThrow(
      NotFoundException,
    );
  });

  it.each(['0', '-1', 'abc', '1.5'])(
    'rejeita capítulo inválido: %s',
    (chapter) => {
      expect(() =>
        createService().service.getVerses('joao', chapter),
      ).toThrow(
        BadRequestException,
      );
    },
  );

  it('rejeita capítulo fora do livro', () => {
    expect(() =>
      createService().service.getVerses('joao', '22'),
    ).toThrow(
      NotFoundException,
    );
  });

  it('registra e projeta seleção manual sem passar pelo guard de voz', async () => {
    const { service, realtimeService, projectionService } = createService();
    const response = await service.selectPassage({
      versionId: 'acf',
      bookId: 'joao',
      chapter: 3,
      verse: 16,
    });

    expect(response).toEqual(
      expect.objectContaining({
        accepted: true,
        delivery: 'local-only',
        deliveredToHolyrics: false,
        deliveryError: null,
        selection: {
          versionId: 'acf',
          bookId: 'joao',
          bookName: 'João',
          chapter: 3,
          verse: 16,
          reference: 'João 3:16',
        },
      }),
    );
    expect(projectionService.project).toHaveBeenCalledWith({
      reference: 'João 3:16',
      version: 'ACF',
    });
    expect(realtimeService.emit).toHaveBeenCalledWith(
      RealtimeEventType.BIBLE_CHANGED,
      {
        book: 'joao',
        chapter: 3,
        verse: 16,
        version: 'ACF',
        source: 'manual',
        delivery: 'local-only',
        deliveredToHolyrics: false,
      },
    );
  });

  it('rejeita versão inexistente na seleção', async () => {
    await expect(
      createService().service.selectPassage({
        versionId: 'inexistente',
        bookId: 'joao',
        chapter: 3,
        verse: 16,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejeita versículo fora do capítulo', async () => {
    await expect(
      createService().service.selectPassage({
        versionId: 'nvi',
        bookId: 'joao',
        chapter: 3,
        verse: 37,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
