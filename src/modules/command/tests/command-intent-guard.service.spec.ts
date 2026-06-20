import type { VoiceCommandMode } from '../../settings/interfaces/settings.interface';
import { CommandType } from '../enums/command-type.enum';
import type { StructuredCommand } from '../interfaces/command.interface';
import { PtBrCommandParser } from '../parsers/pt-br-command.parser';
import { CommandIntentGuardService } from '../services/command-intent-guard.service';

describe('CommandIntentGuardService', () => {
  const service = new CommandIntentGuardService(
    new PtBrCommandParser(),
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

  it('só autoriza comando relativo como frase direta', () => {
    const relative: StructuredCommand = {
      type: CommandType.PREVIOUS_VERSE,
    };

    expect(decide('versículo anterior', 'conservative', relative)).toEqual({
      decision: 'execute',
      reason: 'explicit_action',
    });
    expect(
      decide(
        'como vimos no versículo anterior',
        'conservative',
        relative,
      ),
    ).toEqual({
      decision: 'ignore',
      reason: 'relative_reference_context',
    });
  });
});
