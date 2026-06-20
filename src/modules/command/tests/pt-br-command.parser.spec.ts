import { CommandType } from '../enums/command-type.enum';
import { PtBrCommandParser } from '../parsers/pt-br-command.parser';

describe('PtBrCommandParser', () => {
  const parser = new PtBrCommandParser();

  describe('referências bíblicas', () => {
    it.each([
      ['João 3 16', 'joao', 3, 16],
      ['João 3:16', 'joao', 3, 16],
      ['joao capítulo 3 versículo 16', 'joao', 3, 16],
      ['Romanos 8 1', 'romanos', 8, 1],
      ['Salmos 23:1', 'salmos', 23, 1],
      ['Apocalipse 22 21', 'apocalipse', 22, 21],
      ['Gênesis 1.1', 'genesis', 1, 1],
      ['Jó 1 1', 'jo', 1, 1],
      ['Judas 1 25', 'judas', 1, 25],
    ])(
      'interpreta "%s"',
      (input, book, chapter, verse) => {
        expect(parser.parse(input)).toEqual({
          type: CommandType.BIBLE_REFERENCE,
          book,
          chapter,
          verse,
        });
      },
    );
  });

  describe('referências bíblicas parciais', () => {
    it.each([
      ['gênesis', 'genesis'],
      ['João', 'joao'],
      ['Primeira Coríntios', '1-corintios'],
      ['Sl', 'salmos'],
    ])('interpreta livro em "%s"', (input, book) => {
      expect(parser.parse(input)).toEqual({
        type: CommandType.BIBLE_REFERENCE,
        book,
        chapter: null,
        verse: null,
      });
    });

    it.each([
      ['gênesis capítulo 1', 'genesis', 1],
      ['joão capítulo 3', 'joao', 3],
      ['joão 3', 'joao', 3],
      ['1 Coríntios capítulo 13', '1-corintios', 13],
      ['Salmos 150', 'salmos', 150],
    ])('interpreta livro e capítulo em "%s"', (input, book, chapter) => {
      expect(parser.parse(input)).toEqual({
        type: CommandType.BIBLE_REFERENCE,
        book,
        chapter,
        verse: 1,
      });
    });
  });

  describe('aliases existentes do Bible Module', () => {
    it.each([
      ['Jo 3 16', 'joao', 3, 16],
      ['Joao 3 16', 'joao', 3, 16],
      ['Evangelho de João 3 16', 'joao', 3, 16],
      ['1 Co 13 4', '1-corintios', 13, 4],
      ['Primeira Coríntios 13 4', '1-corintios', 13, 4],
      ['II Timóteo 3 16', '2-timoteo', 3, 16],
      ['Cantares 2 1', 'canticos', 2, 1],
      ['Atos dos Apóstolos 2 4', 'atos', 2, 4],
      ['Filemon 1 4', 'filemom', 1, 4],
    ])('resolve "%s"', (input, book, chapter, verse) => {
      expect(parser.parse(input)).toEqual({
        type: CommandType.BIBLE_REFERENCE,
        book,
        chapter,
        verse,
      });
    });
  });

  it.each([
    'próximo',
    'PROXIMO',
    'próximo versículo',
    'versículo seguinte',
  ])('interpreta próximo versículo: "%s"', (input) => {
    expect(parser.parse(input)).toEqual({
      type: CommandType.NEXT_VERSE,
    });
  });

  it.each(['anterior', 'voltar', 'versículo anterior'])(
    'interpreta versículo anterior: "%s"',
    (input) => {
      expect(parser.parse(input)).toEqual({
        type: CommandType.PREVIOUS_VERSE,
      });
    },
  );

  it.each(['próximo capítulo', 'capítulo seguinte'])(
    'interpreta próximo capítulo: "%s"',
    (input) => {
      expect(parser.parse(input)).toEqual({
        type: CommandType.NEXT_CHAPTER,
      });
    },
  );

  it('interpreta capítulo anterior', () => {
    expect(parser.parse('capítulo anterior')).toEqual({
      type: CommandType.PREVIOUS_CHAPTER,
    });
  });

  it.each([
    '',
    '   ',
    'o próximo irmão',
    'vamos voltar ao texto',
    'vamos estudar gênesis hoje',
    'João versículo 16',
    'João três palavras',
    'João 0 1',
    'João capítulo 22',
    'João 3 99',
    'livro inexistente 1 1',
    null,
    undefined,
    123,
    {},
  ])('retorna UNKNOWN sem lançar erro para %p', (input) => {
    expect(() => parser.parse(input)).not.toThrow();
    expect(parser.parse(input)).toEqual({
      type: CommandType.UNKNOWN,
    });
  });
});
