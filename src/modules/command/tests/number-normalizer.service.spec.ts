import { NumberNormalizerService } from '../services/number-normalizer.service';

describe('NumberNormalizerService', () => {
  const service = new NumberNormalizerService();

  describe('números simples', () => {
    it.each([
      ['zero', '0'],
      ['um', '1'],
      ['uma', '1'],
      ['dois', '2'],
      ['duas', '2'],
      ['três', '3'],
      ['quatro', '4'],
      ['dez', '10'],
      ['dezesseis', '16'],
      ['dezenove', '19'],
      ['vinte', '20'],
      ['cinquenta', '50'],
      ['noventa', '90'],
      ['cem', '100'],
      ['cento', '100'],
    ])('normaliza "%s"', (input, expected) => {
      expect(service.normalize(input)).toBe(expected);
    });
  });

  describe('números compostos', () => {
    it.each([
      ['vinte e um', '21'],
      ['trinta e duas', '32'],
      ['quarenta e três', '43'],
      ['noventa e nove', '99'],
      ['cento e um', '101'],
      ['cento e dezesseis', '116'],
      ['cento e vinte', '120'],
      ['cento e vinte e três', '123'],
      ['cento e quarenta e nove', '149'],
      ['cento e cinquenta', '150'],
    ])('normaliza "%s"', (input, expected) => {
      expect(service.normalize(input)).toBe(expected);
    });
  });

  describe('ordinais masculinos e femininos', () => {
    it.each([
      ['primeiro', '1'],
      ['primeira', '1'],
      ['segundo', '2'],
      ['segunda', '2'],
      ['terceiro', '3'],
      ['terceira', '3'],
      ['quarto', '4'],
      ['quarta', '4'],
      ['quinto', '5'],
      ['quinta', '5'],
      ['sexto', '6'],
      ['sexta', '6'],
      ['sétimo', '7'],
      ['sétima', '7'],
      ['oitavo', '8'],
      ['oitava', '8'],
      ['nono', '9'],
      ['nona', '9'],
      ['décimo', '10'],
      ['décima', '10'],
    ])('normaliza "%s"', (input, expected) => {
      expect(service.normalize(input)).toBe(expected);
    });
  });

  describe('livros numerados', () => {
    it.each([
      ['Primeira Coríntios', '1 Coríntios'],
      ['Segunda Coríntios', '2 Coríntios'],
      ['Primeiro Samuel', '1 Samuel'],
      ['Segunda Reis', '2 Reis'],
      ['Terceira João', '3 João'],
      ['Primeiro Pedro', '1 Pedro'],
    ])('normaliza "%s"', (input, expected) => {
      expect(service.normalize(input)).toBe(expected);
    });
  });

  describe('referências completas', () => {
    it.each([
      [
        'João capítulo três versículo dezesseis',
        'João capítulo 3 versículo 16',
      ],
      [
        'Primeira Coríntios capítulo dois versículo quatro',
        '1 Coríntios capítulo 2 versículo 4',
      ],
      ['João três dezesseis', 'João 3 16'],
      [
        'Salmos cento e cinquenta versículo seis',
        'Salmos 150 versículo 6',
      ],
      [
        'Segundo Samuel capítulo vinte e dois versículo três',
        '2 Samuel capítulo 22 versículo 3',
      ],
    ])('normaliza "%s"', (input, expected) => {
      expect(service.normalize(input)).toBe(expected);
    });
  });

  it.each([
    'João 3 16',
    'próximo versículo',
    'o próximo irmão',
    'texto sem qualquer numeral',
    'II Timóteo 3 16',
    '',
  ])('preserva frase sem número por extenso: "%s"', (input) => {
    expect(service.normalize(input)).toBe(input);
  });

  it.each([
    [null, ''],
    [undefined, ''],
    [123, ''],
    [{}, ''],
  ])('não lança erro para entrada inválida %p', (input, expected) => {
    expect(() => service.normalize(input)).not.toThrow();
    expect(service.normalize(input)).toBe(expected);
  });

  it.each([
    'cento e cinquenta e um',
    'cento e noventa e nove',
    'menos um',
  ])('preserva número fora do escopo: "%s"', (input) => {
    expect(service.normalize(input)).toBe(input);
  });

  it('preserva pontuação ao redor dos números', () => {
    expect(service.normalize('João, capítulo três: dezesseis.')).toBe(
      'João, capítulo 3: 16.',
    );
  });
});
