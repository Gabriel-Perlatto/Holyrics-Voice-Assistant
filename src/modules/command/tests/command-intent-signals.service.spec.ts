import { CommandType } from '../enums/command-type.enum';
import type { StructuredCommand } from '../interfaces/command.interface';
import { CommandIntentSignalsService } from '../services/command-intent-signals.service';

describe('CommandIntentSignalsService', () => {
  const service = new CommandIntentSignalsService();
  const reference: StructuredCommand = {
    type: CommandType.BIBLE_REFERENCE,
    book: 'apocalipse',
    chapter: 12,
    verse: 13,
  };

  it.each([
    'vamos para apocalipse 12 13',
    'abra em apocalipse 12 13',
    'mostre apocalipse 12 13',
    'coloque apocalipse 12 13',
    'projete apocalipse 12 13',
    'agora em apocalipse 12 13',
  ])('detecta ação explícita em "%s"', (text) => {
    expect(service.detect(text, reference)).toEqual({
      decision: 'execute',
      reason: 'explicit_action',
    });
  });

  it.each([
    'como vimos em apocalipse 12 13',
    'segundo apocalipse 12 13',
    'la em apocalipse 12 13 vemos',
  ])('detecta referência casual em "%s"', (text) => {
    expect(service.detect(text, reference)).toEqual({
      decision: 'ignore',
      reason: 'casual_reference',
    });
  });

  it('não confunde verbo depois da referência com comando', () => {
    expect(
      service.detect('o versiculo anterior mostra', {
        type: CommandType.PREVIOUS_VERSE,
      }),
    ).toBeNull();
  });

  it('retorna null quando não há sinal claro', () => {
    expect(service.detect('apocalipse 12 13', reference)).toBeNull();
  });

  it('não trata livro numerado como citação casual', () => {
    const secondPeter: StructuredCommand = {
      type: CommandType.BIBLE_REFERENCE,
      book: '2-pedro',
      chapter: 1,
      verse: 1,
    };

    expect(service.detect('2 pedro 1', secondPeter)).toBeNull();
  });

  it('bloqueia ação explícita negada', () => {
    expect(
      service.detect('nao vamos abrir apocalipse 12 13 agora', reference),
    ).toEqual({ decision: 'ignore', reason: 'casual_reference' });
  });
});
