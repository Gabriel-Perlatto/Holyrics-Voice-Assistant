import type { VoiceCommandMode } from '../../settings/interfaces/settings.interface';
import { CommandType } from '../enums/command-type.enum';
import type { StructuredCommand } from '../interfaces/command.interface';
import { PtBrCommandParser } from '../parsers/pt-br-command.parser';
import { CommandIntentGuardService } from '../services/command-intent-guard.service';
import { CommandIntentSignalsService } from '../services/command-intent-signals.service';
import { CommandRepetitionService } from '../services/command-repetition.service';

describe('CommandIntentGuardService', () => {
  const reference: StructuredCommand = {
    type: CommandType.BIBLE_REFERENCE,
    book: 'apocalipse',
    chapter: 12,
    verse: 13,
  };

  // Cada teste recebe uma instância nova: o guard mantém estado de
  // repetição, então instâncias compartilhadas entre testes poderiam
  // contaminar um caso com o histórico de outro.
  const createGuard = () =>
    new CommandIntentGuardService(
      new PtBrCommandParser(),
      new CommandIntentSignalsService(),
      new CommandRepetitionService(),
    );

  const decide = (
    guard: CommandIntentGuardService,
    text: string,
    mode: VoiceCommandMode = 'conservative',
    command: StructuredCommand = reference,
  ) => guard.decide(text, text, command, mode);

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
    expect(decide(createGuard(), text)).toEqual({
      decision: 'execute',
      reason: 'explicit_action',
    });
  });

  it('autoriza fala direcionada à igreja', () => {
    expect(
      decide(createGuard(), 'igreja vamos para apocalipse 12 13'),
    ).toEqual({
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
    expect(decide(createGuard(), text, 'fast')).toEqual({
      decision: 'ignore',
      reason: 'casual_reference',
    });
  });

  it.each([
    'não vamos abrir apocalipse 12 13 agora',
    'sem trocar a tela apocalipse 12 13',
  ])('bloqueia ação negada: "%s"', (text) => {
    expect(decide(createGuard(), text, 'fast')).toEqual({
      decision: 'ignore',
      reason: 'casual_reference',
    });
  });

  it('diferencia os modos para referência direta', () => {
    expect(decide(createGuard(), 'apocalipse 12 13', 'conservative')).toEqual(
      {
        decision: 'ignore',
        reason: 'unknown_or_unsafe',
      },
    );
    expect(decide(createGuard(), 'apocalipse 12 13', 'fast')).toEqual({
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

    expect(
      decide(createGuard(), '2 pedro 1', 'fast', secondPeter),
    ).toEqual({
      decision: 'execute',
      reason: 'explicit_action',
    });
  });

  it('só autoriza comando relativo como frase direta', () => {
    const guard = createGuard();
    const relative: StructuredCommand = {
      type: CommandType.PREVIOUS_VERSE,
    };

    expect(
      decide(guard, 'versículo anterior', 'conservative', relative),
    ).toEqual({
      decision: 'execute',
      reason: 'explicit_action',
    });
    expect(
      decide(guard, 'como vimos no versículo anterior', 'conservative', relative),
    ).toEqual({
      decision: 'ignore',
      reason: 'relative_reference_context',
    });
  });

  it('mantém frase comum com próximo como insegura quando não há comando', () => {
    expect(
      decide(createGuard(), 'não podemos fazer isso com o próximo', 'conservative', {
        type: CommandType.UNKNOWN,
      }),
    ).toEqual({
      decision: 'ignore',
      reason: 'unknown_or_unsafe',
    });
  });

  it('executa na repetição da mesma referência sem gatilho', () => {
    const guard = createGuard();

    expect(decide(guard, 'apocalipse 12 13', 'conservative')).toEqual({
      decision: 'ignore',
      reason: 'unknown_or_unsafe',
    });
    expect(decide(guard, 'apocalipse 12 13', 'conservative')).toEqual({
      decision: 'execute',
      reason: 'repeated_reference',
    });
  });

  it('não confirma por repetição uma referência diferente', () => {
    const guard = createGuard();
    const otherReference: StructuredCommand = {
      type: CommandType.BIBLE_REFERENCE,
      book: 'joao',
      chapter: 3,
      verse: 16,
    };

    expect(decide(guard, 'apocalipse 12 13', 'conservative')).toEqual({
      decision: 'ignore',
      reason: 'unknown_or_unsafe',
    });
    expect(
      decide(guard, 'joão 3 16', 'conservative', otherReference),
    ).toEqual({
      decision: 'ignore',
      reason: 'unknown_or_unsafe',
    });
  });

  it('confirma por repetição um refinamento de capítulo para versículo', () => {
    const guard = createGuard();
    const chapterOnly: StructuredCommand = {
      type: CommandType.BIBLE_REFERENCE,
      book: 'apocalipse',
      chapter: 12,
      verse: 1,
    };

    expect(decide(guard, 'apocalipse 12', 'conservative', chapterOnly)).toEqual(
      {
        decision: 'ignore',
        reason: 'unknown_or_unsafe',
      },
    );
    expect(decide(guard, 'apocalipse 12 13', 'conservative')).toEqual({
      decision: 'execute',
      reason: 'repeated_reference',
    });
  });

  it('não confirma por repetição uma citação casual da mesma referência', () => {
    const guard = createGuard();

    expect(decide(guard, 'apocalipse 12 13', 'conservative')).toEqual({
      decision: 'ignore',
      reason: 'unknown_or_unsafe',
    });
    expect(
      decide(guard, 'como vimos em apocalipse 12 13', 'conservative'),
    ).toEqual({
      decision: 'ignore',
      reason: 'casual_reference',
    });
  });
});
