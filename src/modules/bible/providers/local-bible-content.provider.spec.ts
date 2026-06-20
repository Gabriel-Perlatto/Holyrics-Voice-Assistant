import { LocalBibleContentProvider } from './local-bible-content.provider';

describe('LocalBibleContentProvider', () => {
  const provider = new LocalBibleContentProvider();

  it('expõe o fallback local e quatro identificadores de versão', () => {
    expect(provider.source).toBe('local-fallback');
    expect(provider.listVersions()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'nvi',
          abbreviation: 'NVI',
          contentAvailable: false,
        }),
        expect.objectContaining({ id: 'acf' }),
      ]),
    );
    expect(provider.listVersions()).toHaveLength(4);
  });

  it('lista os 66 livros do cânon protestante', () => {
    const books = provider.listBooks();

    expect(books).toHaveLength(66);
    expect(books[0]).toEqual(
      expect.objectContaining({
        id: 'genesis',
        chapterCount: 50,
        testament: 'old',
      }),
    );
    expect(books[65]).toEqual(
      expect.objectContaining({
        id: 'apocalipse',
        chapterCount: 22,
        testament: 'new',
      }),
    );
  });

  it('lista capítulos com a contagem correta de versículos', () => {
    const johnChapters = provider.listChapters('joao');

    expect(johnChapters).toHaveLength(21);
    expect(johnChapters[2]).toEqual({ number: 3, verseCount: 36 });
    expect(provider.listChapters('salmos')[118]).toEqual({
      number: 119,
      verseCount: 176,
    });
  });

  it('lista apenas números de versículos, sem conteúdo textual', () => {
    const verses = provider.listVerses('1-corintios', 13);

    expect(verses).toHaveLength(13);
    expect(verses[0]).toEqual({ number: 1 });
    expect(verses[12]).toEqual({ number: 13 });
    expect(verses[0]).not.toHaveProperty('text');
  });
});
