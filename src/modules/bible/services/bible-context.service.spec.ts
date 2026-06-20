import { BibleContextService } from './bible-context.service';

describe('BibleContextService', () => {
  it('cria contexto inicial sem iniciar navegação', () => {
    const service = new BibleContextService();

    expect(service.getContext()).toEqual({
      versionId: 'nvi',
      bookId: null,
      chapter: null,
      verse: null,
    });
  });

  it('não expõe a referência interna para mutação externa', () => {
    const service = new BibleContextService();
    const context = service.getContext();

    context.bookId = 'joao';

    expect(service.getContext().bookId).toBeNull();
  });

  it('atualiza o contexto com uma seleção validada', () => {
    const service = new BibleContextService();

    expect(
      service.selectPassage({
        versionId: 'acf',
        bookId: 'joao',
        chapter: 3,
        verse: 16,
      }),
    ).toEqual({
      versionId: 'acf',
      bookId: 'joao',
      chapter: 3,
      verse: 16,
    });
  });
});
