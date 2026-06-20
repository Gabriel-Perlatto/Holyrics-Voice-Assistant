import { BookAliasService } from './book-alias.service';

describe('BookAliasService', () => {
  const service = new BookAliasService();

  it.each([
    ['João', 'joao'],
    ['Jo', 'joao'],
    ['Evangelho de João', 'joao'],
    ['Gênesis', 'genesis'],
    ['Genesis', 'genesis'],
    ['Gn', 'genesis'],
    ['1 Coríntios', '1-corintios'],
    ['Primeira Coríntios', '1-corintios'],
    ['Primeiro Coríntios', '1-corintios'],
    ['I Coríntios', '1-corintios'],
  ])('resolve %s para %s', (alias, expectedBookId) => {
    expect(service.resolve(alias)?.id).toBe(expectedBookId);
  });

  it('preserva a distinção entre Jó e Jo', () => {
    expect(service.resolve('Jó')?.id).toBe('jo');
    expect(service.resolve('Jo')?.id).toBe('joao');
  });

  it('retorna undefined para alias desconhecido', () => {
    expect(service.resolve('Livro inexistente')).toBeUndefined();
  });
});
