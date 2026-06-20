import type { BibleNavigationService } from '../../bible/services/bible-navigation.service';
import { RealtimeEventType } from '../../realtime/enums/realtime-event-type.enum';
import type { RealtimeService } from '../../realtime/services/realtime.service';
import type { SettingsService } from '../../settings/services/settings.service';
import type { VoiceCommandMode } from '../../settings/interfaces/settings.interface';
import { CommandType } from '../enums/command-type.enum';
import { PtBrCommandParser } from '../parsers/pt-br-command.parser';
import { CommandContextService } from '../services/command-context.service';
import { CommandIntentGuardService } from '../services/command-intent-guard.service';
import { CommandService } from '../services/command.service';
import { NumberNormalizerService } from '../services/number-normalizer.service';

describe('CommandService', () => {
  const createService = (
    voiceCommandMode: VoiceCommandMode = 'conservative',
  ) => {
    const realtime = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<RealtimeService>;
    const navigation = {
      apply: jest.fn(async () => undefined),
    } as unknown as jest.Mocked<BibleNavigationService>;
    const settings = {
      getSettings: jest.fn(() => ({ voiceCommandMode })),
    } as unknown as jest.Mocked<SettingsService>;
    const parser = new PtBrCommandParser();
    const service = new CommandService(
      parser,
      new NumberNormalizerService(),
      new CommandContextService(),
      realtime,
      navigation,
      new CommandIntentGuardService(parser),
      settings,
    );

    return { realtime, navigation, service };
  };

  it.each([
    'agora vamos para apocalipse 12 13',
    'abra em apocalipse 12 13',
    'mostre apocalipse 12 13',
    'coloque apocalipse 12 13',
    'projete apocalipse 12 13',
    'vamos ler apocalipse 12 13',
    'agora em apocalipse 12 13',
  ])('executa referência com ação explícita: "%s"', async (input) => {
    const { navigation, service } = createService();

    const result = await service.identify(input);

    expect(result).toEqual({
      command: {
        type: CommandType.BIBLE_REFERENCE,
        book: 'apocalipse',
        chapter: 12,
        verse: 13,
      },
      confidence: 1,
      intentDecision: 'execute',
      intentReason: 'explicit_action',
    });
    expect(navigation.apply).toHaveBeenCalledWith({
      ...result.command,
      confidence: 1,
    });
  });

  it.each([
    'como vimos em apocalipse 12 13',
    'como está em apocalipse 12 13',
    'isso também aparece em apocalipse 12 13',
    'segundo apocalipse 12 13',
    'lá em apocalipse 12 13 vemos',
    'em apocalipse 12 13 temos a mesma informação',
  ])('ignora referência casual: "%s"', async (input) => {
    const { navigation, service } = createService();

    const result = await service.identify(input);

    expect(result).toMatchObject({
      command: {
        type: CommandType.BIBLE_REFERENCE,
        book: 'apocalipse',
        chapter: 12,
        verse: 13,
      },
      confidence: 1,
      intentDecision: 'ignore',
      intentReason: 'casual_reference',
    });
    expect(navigation.apply).not.toHaveBeenCalled();
  });

  it.each([
    'como vimos no versículo anterior',
    'o versículo anterior mostra',
    'no próximo versículo veremos',
  ])('ignora comando relativo contextual: "%s"', async (input) => {
    const { navigation, service } = createService();

    const result = await service.identify(input);

    expect(result).toMatchObject({
      confidence: 1,
      intentDecision: 'ignore',
      intentReason: 'relative_reference_context',
    });
    expect(navigation.apply).not.toHaveBeenCalled();
  });

  it.each(['o próximo irmão pode vir', 'a próxima pessoa'])(
    'mantém frase comum como UNKNOWN: "%s"',
    async (input) => {
      const { navigation, service } = createService();

      expect(await service.identify(input)).toEqual({
        command: { type: CommandType.UNKNOWN },
        confidence: 0,
        intentDecision: 'ignore',
        intentReason: 'unknown_or_unsafe',
      });
      expect(navigation.apply).not.toHaveBeenCalled();
    },
  );

  it('modo conservador ignora referência direta', async () => {
    const { navigation, service } = createService('conservative');

    expect(await service.identify('Apocalipse 12 13')).toMatchObject({
      intentDecision: 'ignore',
      intentReason: 'unknown_or_unsafe',
    });
    expect(navigation.apply).not.toHaveBeenCalled();
  });

  it('modo rápido executa referência direta', async () => {
    const { navigation, service } = createService('fast');

    expect(await service.identify('Apocalipse 12 13')).toMatchObject({
      intentDecision: 'execute',
      intentReason: 'explicit_action',
    });
    expect(navigation.apply).toHaveBeenCalledTimes(1);
  });

  it('modo rápido continua ignorando referência casual', async () => {
    const { navigation, service } = createService('fast');

    expect(
      await service.identify('como vimos em Apocalipse 12 13'),
    ).toMatchObject({
      intentDecision: 'ignore',
      intentReason: 'casual_reference',
    });
    expect(navigation.apply).not.toHaveBeenCalled();
  });

  it.each([
    ['próximo versículo', CommandType.NEXT_VERSE],
    ['versículo anterior', CommandType.PREVIOUS_VERSE],
    ['capítulo seguinte', CommandType.NEXT_CHAPTER],
    ['capítulo anterior', CommandType.PREVIOUS_CHAPTER],
  ])('executa comando relativo direto: "%s"', async (input, type) => {
    const { navigation, service } = createService();

    const result = await service.identify(input);

    expect(result).toMatchObject({
      command: { type },
      intentDecision: 'execute',
      intentReason: 'explicit_action',
    });
    expect(navigation.apply).toHaveBeenCalledTimes(1);
  });

  it('normaliza números antes de extrair a referência', async () => {
    const { service } = createService();

    const result = await service.identify(
      'vamos para primeira coríntios capítulo treze',
    );

    expect(result.command).toEqual({
      type: CommandType.BIBLE_REFERENCE,
      book: '1-corintios',
      chapter: 13,
      verse: 1,
    });
    expect(service.getStatus().lastNormalizedTranscription).toBe(
      'vamos para 1 coríntios capítulo 13',
    );
  });

  it('emite payload estruturado e seguro', async () => {
    const { realtime, service } = createService();

    const result = await service.identify(
      'vamos para João capítulo três versículo dezesseis',
    );

    expect(realtime.emit).toHaveBeenCalledWith(
      RealtimeEventType.COMMAND_IDENTIFIED,
      result,
    );
    expect(result).toEqual({
      command: {
        type: CommandType.BIBLE_REFERENCE,
        book: 'joao',
        chapter: 3,
        verse: 16,
      },
      confidence: 1,
      intentDecision: 'execute',
      intentReason: 'explicit_action',
    });
    expect(result).not.toHaveProperty('text');
    expect(result).not.toHaveProperty('transcription');
    expect(JSON.stringify(result)).not.toContain('token');
  });

  it('não emite COMMAND_EXECUTED', async () => {
    const { realtime, service } = createService();

    await service.identify('vamos para João 3 16');

    expect(realtime.emit).not.toHaveBeenCalledWith(
      RealtimeEventType.COMMAND_EXECUTED,
      expect.anything(),
    );
  });
});
