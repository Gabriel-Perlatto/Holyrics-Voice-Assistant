import type { VoiceCommandMode } from '../../settings/interfaces/settings.interface';
import { CommandType } from '../enums/command-type.enum';
import type { StructuredCommand } from '../interfaces/command.interface';
import { PtBrCommandParser } from '../parsers/pt-br-command.parser';
import { CommandIntentGuardService } from '../services/command-intent-guard.service';
import { CommandIntentSignalsService } from '../services/command-intent-signals.service';

describe('CommandIntentGuardService', () => {
  const service = new CommandIntentGuardService(
    new PtBrCommandParser(),
    new CommandIntentSignalsService(),
  );
  const reference: StructuredCommand = {
    type: CommandType.BIBLE_REFERENCE,
    book: 'apocalipse',
    chapter: 12,
    verse: 13,
  };

  const decide = (
    text: string,
    mode: VoiceCommandMode = 'conservative',
    command: StructuredCommand = reference,
  ) => service.decide(text, text, command, mode);

  it.each([
    'vamos para apocalipse 12 13',
    'vamos parar apocalipse 12 13',
    'vamos pra apocalipse 12 13',
    'vamos ao apocalipse 12 13',
    'abra em apocalipse 12 13',
    'mostre apocalipse 12 13',
    'coloque apocalipse 12 13',
    'projete apocalipse 12 13',
    'vamos ler apocalipse 12 13',
    'agora em apocalipse 12 13',
  ])('autoriza ação explícita: "%s"', (text) => {
    expect(decide(text)).toEqual({
      decision: 'execute',
      reason: 'explicit_action',
    });
  });

  it('autoriza fala direcionada à igreja', () => {
    expect(decide('igreja vamos para apocalipse 12 13')).toEqual({
      decision: 'execute',
      reason: 'explicit_action',
    });
  });

  it.each([
    'como vimos em apocalipse 12 13',
    'como está em apocalipse 12 13',
    'isso também aparece em apocalipse 12 13',
    'segundo apocalipse 12 13',
    'lá em apocalipse 12 13 vemos',
    'em apocalipse 12 13 temos a mesma informação',
  ])('bloqueia contexto casual: "%s"', (text) => {
    expect(decide(text, 'fast')).toEqual({
      decision: 'ignore',
      reason: 'casual_reference',
    });
  });

  it.each([
    'não vamos abrir apocalipse 12 13 agora',
    'sem trocar a tela apocalipse 12 13',
  ])('bloqueia ação negada: "%s"', (text) => {
    expect(decide(text, 'fast')).toEqual({
      decision: 'ignore',
      reason: 'casual_reference',
    });
  });

  it('diferencia os modos para referência direta', () => {
    expect(decide('apocalipse 12 13', 'conservative')).toEqual({
      decision: 'ignore',
      reason: 'unknown_or_unsafe',
    });
    expect(decide('apocalipse 12 13', 'fast')).toEqual({
      decision: 'execute',
      reason: 'explicit_action',
    });
  });

  it('trata referência a livro numerado como direta, não como citação', () => {
    const secondPeter: StructuredCommand = {
      type: CommandType.BIBLE_REFERENCE,
      book: '2-pedro',
      chapter: 1,
      verse: 1,
    };

    expect(decide('2 pedro 1', 'fast', secondPeter)).toEqual({
      decision: 'execute',
      reason: 'explicit_action',
    });
  });

  it('só autoriza comando relativo como frase direta', () => {
    const relative: StructuredCommand = {
      type: CommandType.PREVIOUS_VERSE,
    };

    expect(decide('versículo anterior', 'conservative', relative)).toEqual({
      decision: 'execute',
      reason: 'explicit_action',
    });
    expect(
      decide('como vimos no versículo anterior', 'conservative', relative),
    ).toEqual({
      decision: 'ignore',
      reason: 'relative_reference_context',
    });
  });

  it('mantém frase comum com próximo como insegura quando não há comando', () => {
    expect(
      decide('não podemos fazer isso com o próximo', 'conservative', {
        type: CommandType.UNKNOWN,
      }),
    ).toEqual({
      decision: 'ignore',
      reason: 'unknown_or_unsafe',
    });
  });
});
