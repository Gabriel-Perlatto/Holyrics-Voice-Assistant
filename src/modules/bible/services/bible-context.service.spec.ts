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
});
