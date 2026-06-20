import type { BibleService } from '../services/bible.service';
import { BibleController } from './bible.controller';

describe('BibleController', () => {
  const bibleService = {
    getVersions: jest.fn(() => ({ endpoint: 'versions' })),
    getBooks: jest.fn(() => ({ endpoint: 'books' })),
    getChapters: jest.fn((book: string) => ({ endpoint: 'chapters', book })),
    getVerses: jest.fn((book: string, chapter: string) => ({
      endpoint: 'verses',
      book,
      chapter,
    })),
    selectPassage: jest.fn((input) => ({
      endpoint: 'selection',
      input,
    })),
  } as unknown as jest.Mocked<BibleService>;
  const controller = new BibleController(bibleService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delega a listagem de versões', () => {
    controller.getVersions();
    expect(bibleService.getVersions).toHaveBeenCalledTimes(1);
  });

  it('delega a listagem de livros', () => {
    controller.getBooks();
    expect(bibleService.getBooks).toHaveBeenCalledTimes(1);
  });

  it('repassa o livro para consulta de capítulos', () => {
    controller.getChapters({ book: 'Jo' });
    expect(bibleService.getChapters).toHaveBeenCalledWith('Jo');
  });

  it('repassa livro e capítulo para consulta de versículos', () => {
    controller.getVerses({ book: 'Jo', chapter: '3' });
    expect(bibleService.getVerses).toHaveBeenCalledWith('Jo', '3');
  });

  it('repassa a seleção para o serviço', () => {
    const input = {
      versionId: 'nvi',
      bookId: 'joao',
      chapter: 3,
      verse: 16,
    };

    controller.selectPassage(input);

    expect(bibleService.selectPassage).toHaveBeenCalledWith(input);
  });
});
