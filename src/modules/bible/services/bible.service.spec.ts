import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { LocalBibleContentProvider } from '../providers/local-bible-content.provider';
import { BibleContextService } from './bible-context.service';
import { BibleService } from './bible.service';
import { BookAliasService } from './book-alias.service';

describe('BibleService', () => {
  const createService = () =>
    new BibleService(
      new LocalBibleContentProvider(),
      new BookAliasService(),
      new BibleContextService(),
    );

  it('identifica claramente versões como fallback local', () => {
    const response = createService().getVersions();

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
    const byId = createService().getChapters('joao');
    const byAlias = createService().getChapters('Evangelho de João');

    expect(byId.book.id).toBe('joao');
    expect(byAlias.book.id).toBe('joao');
    expect(byAlias.items).toHaveLength(21);
  });

  it('consulta versículos e mantém a versão inicial no resultado', () => {
    const response = createService().getVerses('Jo', '3');

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
    expect(() => createService().getChapters('inexistente')).toThrow(
      NotFoundException,
    );
  });

  it.each(['0', '-1', 'abc', '1.5'])(
    'rejeita capítulo inválido: %s',
    (chapter) => {
      expect(() => createService().getVerses('joao', chapter)).toThrow(
        BadRequestException,
      );
    },
  );

  it('rejeita capítulo fora do livro', () => {
    expect(() => createService().getVerses('joao', '22')).toThrow(
      NotFoundException,
    );
  });
});
