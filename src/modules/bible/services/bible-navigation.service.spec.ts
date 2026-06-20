import { CommandType } from '../../command/enums/command-type.enum';
import type { IdentifiedCommand } from '../../command/interfaces/command.interface';
import type { HolyricsBibleProjectionService } from '../../holyrics/services/holyrics-bible-projection.service';
import { RealtimeEventType } from '../../realtime/enums/realtime-event-type.enum';
import type { RealtimeService } from '../../realtime/services/realtime.service';
import { LocalBibleContentProvider } from '../providers/local-bible-content.provider';
import { BibleContextService } from './bible-context.service';
import { BibleNavigationService } from './bible-navigation.service';

describe('BibleNavigationService', () => {
  const reference = (
    book: string,
    chapter: number | null,
    verse: number | null,
  ): IdentifiedCommand => ({
    type: CommandType.BIBLE_REFERENCE,
    book,
    chapter,
    verse,
    confidence: 1,
  });

  const navigation = (
    type:
      | CommandType.NEXT_VERSE
      | CommandType.PREVIOUS_VERSE
      | CommandType.NEXT_CHAPTER
      | CommandType.PREVIOUS_CHAPTER,
  ): IdentifiedCommand => ({ type, confidence: 1 });

  const createService = (
    delivery: 'holyrics' | 'local-only' | 'failed' = 'local-only',
  ) => {
    const context = new BibleContextService();
    const realtime = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<RealtimeService>;
    const projection = {
      project: jest.fn(async () => ({
        reference: 'João 3:16',
        version: 'NVI',
        delivery,
        deliveredToHolyrics: delivery === 'holyrics',
        message: 'Resultado controlado.',
        error: delivery === 'failed' ? 'Falha controlada.' : null,
        attemptedAt: '2026-06-20T00:00:00.000Z',
      })),
    } as unknown as jest.Mocked<HolyricsBibleProjectionService>;
    const service = new BibleNavigationService(
      new LocalBibleContentProvider(),
      context,
      realtime,
      projection,
    );

    return { context, realtime, projection, service };
  };

  it('aplica referência direta e preserva a versão atual', async () => {
    const { context, projection, service } = createService('holyrics');
    context.selectPassage({
      versionId: 'acf',
      bookId: null,
      chapter: null,
      verse: null,
    });

    const status = await service.apply(reference('joao', 3, 16));

    expect(status.context).toEqual({
      versionId: 'acf',
      bookId: 'joao',
      chapter: 3,
      verse: 16,
    });
    expect(status.currentReference).toBe('João 3:16 (ACF)');
    expect(projection.project).toHaveBeenCalledWith({
      reference: 'João 3:16',
      version: 'ACF',
    });
  });

  it('resolve livro isolado como capítulo 1 versículo 1', async () => {
    const { service } = createService();

    expect(
      (await service.apply(reference('genesis', null, null))).context,
    ).toEqual({
      versionId: 'nvi',
      bookId: 'genesis',
      chapter: 1,
      verse: 1,
    });
  });

  it.each([
    [CommandType.NEXT_VERSE, 3, 16, 3, 17],
    [CommandType.PREVIOUS_VERSE, 3, 16, 3, 15],
    [CommandType.NEXT_CHAPTER, 3, 16, 4, 1],
    [CommandType.PREVIOUS_CHAPTER, 4, 16, 3, 1],
  ])(
    'aplica %s',
    async (type, chapter, verse, expectedChapter, expectedVerse) => {
      const { service } = createService();
      await service.apply(reference('joao', chapter, verse));

      expect(
        (
          await service.apply(
            navigation(type as Parameters<typeof navigation>[0]),
          )
        ).context,
      ).toEqual({
        versionId: 'nvi',
        bookId: 'joao',
        chapter: expectedChapter,
        verse: expectedVerse,
      });
    },
  );

  it.each([
    [CommandType.NEXT_VERSE, 3, 36, 4, 1],
    [CommandType.PREVIOUS_VERSE, 4, 1, 3, 36],
  ])(
    'atravessa limite de capítulo com %s',
    async (type, chapter, verse, expectedChapter, expectedVerse) => {
      const { service } = createService();
      await service.apply(reference('joao', chapter, verse));

      expect(
        (
          await service.apply(
            navigation(type as Parameters<typeof navigation>[0]),
          )
        ).context,
      ).toEqual({
        versionId: 'nvi',
        bookId: 'joao',
        chapter: expectedChapter,
        verse: expectedVerse,
      });
    },
  );

  it('avança entre livros', async () => {
    const { service } = createService();
    await service.apply(reference('joao', 21, 25));

    expect(
      (await service.apply(navigation(CommandType.NEXT_VERSE))).context,
    ).toEqual({
      versionId: 'nvi',
      bookId: 'atos',
      chapter: 1,
      verse: 1,
    });
  });

  it('volta entre livros', async () => {
    const { service } = createService();
    await service.apply(reference('atos', 1, 1));

    expect(
      (await service.apply(navigation(CommandType.PREVIOUS_VERSE))).context,
    ).toEqual({
      versionId: 'nvi',
      bookId: 'joao',
      chapter: 21,
      verse: 25,
    });
  });

  it('não navega nem projeta sem contexto atual', async () => {
    const { realtime, projection, service } = createService();

    const status = await service.apply(
      navigation(CommandType.NEXT_VERSE),
    );

    expect(status.context.bookId).toBeNull();
    expect(status.lastAppliedCommand).toBeNull();
    expect(projection.project).not.toHaveBeenCalled();
    expect(realtime.emit).not.toHaveBeenCalled();
  });

  it('mantém limite absoluto sem emissão redundante', async () => {
    const { realtime, projection, service } = createService();
    await service.apply(reference('genesis', 1, 1));
    realtime.emit.mockClear();
    projection.project.mockClear();

    await service.apply(navigation(CommandType.PREVIOUS_VERSE));

    expect(service.getStatus().context).toEqual({
      versionId: 'nvi',
      bookId: 'genesis',
      chapter: 1,
      verse: 1,
    });
    expect(projection.project).not.toHaveBeenCalled();
    expect(realtime.emit).not.toHaveBeenCalled();
  });

  it.each([
    ['holyrics', true],
    ['local-only', false],
    ['failed', false],
  ] as const)(
    'emite BIBLE_CHANGED com delivery %s',
    async (delivery, deliveredToHolyrics) => {
      const { realtime, service } = createService(delivery);
      const command = reference('joao', 3, 16);

      await service.apply(command);

      expect(realtime.emit).toHaveBeenCalledWith(
        RealtimeEventType.BIBLE_CHANGED,
        {
          book: 'joao',
          chapter: 3,
          verse: 16,
          version: 'NVI',
          source: 'voice',
          delivery,
          deliveredToHolyrics,
        },
      );
      expect(realtime.emit).not.toHaveBeenCalledWith(
        RealtimeEventType.COMMAND_EXECUTED,
        expect.anything(),
      );
      expect(service.getStatus().lastAppliedCommand).toEqual(command);
    },
  );
});
