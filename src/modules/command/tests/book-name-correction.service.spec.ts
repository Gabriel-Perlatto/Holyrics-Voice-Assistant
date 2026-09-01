import { BookNameCorrectionService } from '../services/book-name-correction.service';

describe('BookNameCorrectionService', () => {
  const service = new BookNameCorrectionService();

  it('corrige um pequeno desvio no nome do livro', () => {
    expect(service.correct('vamos para apocaliste 12 13')).toBe(
      'vamos para apocalipse 12 13',
    );
  });

  it('corrige o nome de um livro numerado sem alterar o número', () => {
    expect(service.correct('vamos para 2 petro 1')).toBe(
      'vamos para 2 pedro 1',
    );
  });

  it('preserva um nome de livro já correto', () => {
    expect(service.correct('vamos para apocalipse 12 13')).toBe(
      'vamos para apocalipse 12 13',
    );
    expect(service.correct('vamos para gênesis 3')).toBe(
      'vamos para gênesis 3',
    );
  });

  it('não corrige quando a palavra é ambígua entre dois livros', () => {
    // "axos" está à mesma distância de "atos" e de "amos"; não deve
    // adivinhar entre os dois.
    const input = 'vamos para axos 5';

    expect(service.correct(input)).toBe(input);
  });

  it('não corrige palavras curtas', () => {
    expect(service.correct('vamos para jo 5')).toBe('vamos para jo 5');
  });

  it('não altera palavras-chave do domínio', () => {
    expect(service.correct('vamos para joão capítulo 3')).toBe(
      'vamos para joão capítulo 3',
    );
  });

  it('não corrige uma palavra comum que não é seguida por um número', () => {
    // "vamos" fica a uma edição de "Amós"; sem um número logo depois, a
    // frase de gatilho não pode ser corrompida por essa proximidade.
    expect(service.correct('vamos para apocalipse 12 13')).toBe(
      'vamos para apocalipse 12 13',
    );
    expect(service.correct('o amor de Deus é grande')).toBe(
      'o amor de Deus é grande',
    );
  });

  it('corrige mesmo quando a palavra comum é seguida por um número', () => {
    // Risco residual documentado: se a palavra comum vier antes de um
    // número por coincidência, a correção ainda pode ocorrer.
    expect(service.correct('amor 12')).toBe('amos 12');
  });

  it('mantém entrada vazia ou não textual', () => {
    expect(service.correct('')).toBe('');
    expect(service.correct(undefined)).toBe('');
  });
});
