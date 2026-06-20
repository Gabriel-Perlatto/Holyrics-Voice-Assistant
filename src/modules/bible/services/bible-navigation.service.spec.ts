import { CommandType } from '../../command/enums/command-type.enum';
import type { IdentifiedCommand } from '../../command/interfaces/command.interface';
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

  const createService = () => {
    const context = new BibleContextService();
    const realtime = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<RealtimeService>;
    const service = new BibleNavigationService(
      new LocalBibleContentProvider(),
      context,
      realtime,
    );

    return { context, realtime, service };
  };

  it('aplica referência direta e preserva a versão atual', () => {
    const { context, service } = createService();
    context.selectPassage({
      versionId: 'acf',
      bookId: null,
      chapter: null,
      verse: null,
    });

    const status = service.apply(reference('joao', 3, 16));

    expect(status.context).toEqual({
      versionId: 'acf',
      bookId: 'joao',
      chapter: 3,
      verse: 16,
    });
    expect(status.currentReference).toBe('João 3:16 (ACF)');
  });

  it('resolve livro isolado como capítulo 1 versículo 1', () => {
    const { service } = createService();

    expect(service.apply(reference('genesis', null, null)).context).toEqual({
      versionId: 'nvi',
      bookId: 'genesis',
      chapter: 1,
      verse: 1,
    });
  });

  it('avança para o próximo versículo', () => {
    const { service } = createService();
    service.apply(reference('joao', 3, 16));

    expect(
      service.apply(navigation(CommandType.NEXT_VERSE)).context,
    ).toEqual({
      versionId: 'nvi',
      bookId: 'joao',
      chapter: 3,
      verse: 17,
    });
  });

  it('volta para o versículo anterior', () => {
    const { service } = createService();
    service.apply(reference('joao', 3, 16));

    expect(
      service.apply(navigation(CommandType.PREVIOUS_VERSE)).context,
    ).toEqual({
      versionId: 'nvi',
      bookId: 'joao',
      chapter: 3,
      verse: 15,
    });
  });

  it('avança do fim de um capítulo para o próximo', () => {
    const { service } = createService();
    service.apply(reference('joao', 3, 36));

    expect(
      service.apply(navigation(CommandType.NEXT_VERSE)).context,
    ).toEqual({
      versionId: 'nvi',
      bookId: 'joao',
      chapter: 4,
      verse: 1,
    });
  });

  it('volta do início de um capítulo para o capítulo anterior', () => {
    const { service } = createService();
    service.apply(reference('joao', 4, 1));

    expect(
      service.apply(navigation(CommandType.PREVIOUS_VERSE)).context,
    ).toEqual({
      versionId: 'nvi',
      bookId: 'joao',
      chapter: 3,
      verse: 36,
    });
  });

  it('avança capítulo e reinicia no versículo 1', () => {
    const { service } = createService();
    service.apply(reference('joao', 3, 16));

    expect(
      service.apply(navigation(CommandType.NEXT_CHAPTER)).context,
    ).toEqual({
      versionId: 'nvi',
      bookId: 'joao',
      chapter: 4,
      verse: 1,
    });
  });

  it('volta capítulo e reinicia no versículo 1', () => {
    const { service } = createService();
    service.apply(reference('joao', 4, 16));

    expect(
      service.apply(navigation(CommandType.PREVIOUS_CHAPTER)).context,
    ).toEqual({
      versionId: 'nvi',
      bookId: 'joao',
      chapter: 3,
      verse: 1,
    });
  });

  it('avança entre livros ao terminar o último capítulo', () => {
    const { service } = createService();
    service.apply(reference('joao', 21, 25));

    expect(
      service.apply(navigation(CommandType.NEXT_VERSE)).context,
    ).toEqual({
      versionId: 'nvi',
      bookId: 'atos',
      chapter: 1,
      verse: 1,
    });
  });

  it('volta entre livros ao estar na primeira referência', () => {
    const { service } = createService();
    service.apply(reference('atos', 1, 1));

    expect(
      service.apply(navigation(CommandType.PREVIOUS_VERSE)).context,
    ).toEqual({
      versionId: 'nvi',
      bookId: 'joao',
      chapter: 21,
      verse: 25,
    });
  });

  it('não navega nem emite evento sem contexto atual', () => {
    const { realtime, service } = createService();

    const status = service.apply(navigation(CommandType.NEXT_VERSE));

    expect(status.context.bookId).toBeNull();
    expect(status.lastAppliedCommand).toBeNull();
    expect(realtime.emit).not.toHaveBeenCalled();
  });

  it('mantém os limites absolutos sem emitir mudança redundante', () => {
    const { realtime, service } = createService();
    service.apply(reference('genesis', 1, 1));
    realtime.emit.mockClear();

    service.apply(navigation(CommandType.PREVIOUS_VERSE));

    expect(service.getStatus().context).toEqual({
      versionId: 'nvi',
      bookId: 'genesis',
      chapter: 1,
      verse: 1,
    });
    expect(realtime.emit).not.toHaveBeenCalled();
  });

  it('emite BIBLE_CHANGED com payload local seguro', () => {
    const { realtime, service } = createService();
    const command = reference('joao', 3, 16);

    service.apply(command);

    expect(realtime.emit).toHaveBeenCalledWith(
      RealtimeEventType.BIBLE_CHANGED,
      {
        book: { id: 'joao', name: 'João' },
        chapter: 3,
        verse: 16,
        version: 'nvi',
        source: 'local-fallback',
        delivery: 'local-only',
        deliveredToHolyrics: false,
      },
    );
    expect(realtime.emit).not.toHaveBeenCalledWith(
      RealtimeEventType.COMMAND_EXECUTED,
      expect.anything(),
    );
    expect(service.getStatus().lastAppliedCommand).toEqual(command);
  });
});
