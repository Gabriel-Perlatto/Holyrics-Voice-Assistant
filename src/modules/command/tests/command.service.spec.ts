import type { BibleNavigationService } from '../../bible/services/bible-navigation.service';
import { RealtimeEventType } from '../../realtime/enums/realtime-event-type.enum';
import type { RealtimeService } from '../../realtime/services/realtime.service';
import type { SettingsService } from '../../settings/services/settings.service';
import { CommandType } from '../enums/command-type.enum';
import { PtBrCommandParser } from '../parsers/pt-br-command.parser';
import { BookNameCorrectionService } from '../services/book-name-correction.service';
import { CommandContextService } from '../services/command-context.service';
import { CommandIntentGuardService } from '../services/command-intent-guard.service';
import { CommandIntentSignalsService } from '../services/command-intent-signals.service';
import { CommandRepetitionService } from '../services/command-repetition.service';
import { CommandService } from '../services/command.service';
import { NumberNormalizerService } from '../services/number-normalizer.service';
import { TranscriptionCorrectionService } from '../services/transcription-correction.service';

describe('CommandService', () => {
  const createService = (voiceActivationWord: string | null = null) => {
    const realtime = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<RealtimeService>;
    const navigation = {
      apply: jest.fn(async () => undefined),
    } as unknown as jest.Mocked<BibleNavigationService>;
    const settings = {
      getSettings: jest.fn(() => ({
        language: 'pt-BR',
        voiceActivationWord,
      })),
    } as unknown as jest.Mocked<SettingsService>;
    const parser = new PtBrCommandParser();
    const service = new CommandService(
      parser,
      new NumberNormalizerService(),
      new TranscriptionCorrectionService(),
      new BookNameCorrectionService(),
      new CommandContextService(),
      realtime,
      navigation,
      new CommandIntentGuardService(
        parser,
        new CommandIntentSignalsService(),
        new CommandRepetitionService(),
      ),
      settings,
    );

    return { realtime, navigation, service };
  };

  it.each([
    'agora vamos para apocalipse 12 13',
    'igreja vamos para apocalipse 12 13',
    'acompanhe comigo em apocalipse 12 13',
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

  it('executa referência quando Vosk transcreve "apocalipse" como "apocaliste"', async () => {
    const { navigation, service } = createService();

    const result = await service.identify(
      'vamos para apocaliste 12 13',
    );

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

  it('executa referência quando Vosk transcreve "capítulo" como "capeta"', async () => {
    const { navigation, service } = createService();

    const result = await service.identify(
      'vamos para gênesis capeta 3',
    );

    expect(result).toEqual({
      command: {
        type: CommandType.BIBLE_REFERENCE,
        book: 'genesis',
        chapter: 3,
        verse: 1,
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

  it('executa referência quando Vosk normaliza "vamos para" como "vamos parar"', async () => {
    const { navigation, service } = createService();

    const result = await service.identify('vamos parar êxodo um');

    expect(result).toEqual({
      command: {
        type: CommandType.BIBLE_REFERENCE,
        book: 'exodo',
        chapter: 1,
        verse: 1,
      },
      confidence: 1,
      intentDecision: 'execute',
      intentReason: 'explicit_action',
    });
    expect(service.getStatus().lastNormalizedTranscription).toBe(
      'vamos parar êxodo 1',
    );
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
    'a lógica é a mesma em apocalipse 12 13',
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

  it.each([
    'o próximo irmão pode vir',
    'a próxima pessoa',
    'não podemos fazer isso com o próximo',
  ])(
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

  it('executa referência direta com a palavra de ativação configurada', async () => {
    const { navigation, service } = createService('sistema');

    const result = await service.identify('sistema Apocalipse 12 13');

    expect(result).toMatchObject({
      intentDecision: 'execute',
      intentReason: 'explicit_action',
    });
    expect(navigation.apply).toHaveBeenCalledTimes(1);
  });

  it('não reconhece a palavra de ativação quando ela está desativada', async () => {
    const { navigation, service } = createService(null);

    const result = await service.identify('sistema Apocalipse 12 13');

    expect(result).toMatchObject({
      intentDecision: 'ignore',
      intentReason: 'unknown_or_unsafe',
    });
    expect(navigation.apply).not.toHaveBeenCalled();
  });

  it('executa referência direta sem precisar de gatilho', async () => {
    const { navigation, service } = createService();

    expect(await service.identify('Apocalipse 12 13')).toMatchObject({
      intentDecision: 'execute',
      intentReason: 'explicit_action',
    });
    expect(navigation.apply).toHaveBeenCalledTimes(1);
  });

  it('continua ignorando referência casual mesmo sem modo conservador', async () => {
    const { navigation, service } = createService();

    expect(
      await service.identify('como vimos em Apocalipse 12 13'),
    ).toMatchObject({
      intentDecision: 'ignore',
      intentReason: 'casual_reference',
    });
    expect(navigation.apply).not.toHaveBeenCalled();
  });

  it('executa referência embutida repetida sem gatilho após ser ignorada', async () => {
    const { navigation, service } = createService();
    const embedded = 'sabe aquele texto Apocalipse 12 13';

    const first = await service.identify(embedded);

    expect(first).toMatchObject({
      intentDecision: 'ignore',
      intentReason: 'unknown_or_unsafe',
    });
    expect(navigation.apply).not.toHaveBeenCalled();

    const second = await service.identify(embedded);

    expect(second).toMatchObject({
      intentDecision: 'execute',
      intentReason: 'repeated_reference',
    });
    expect(navigation.apply).toHaveBeenCalledTimes(1);
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

  describe('junção de borda entre segmentos', () => {
    it('executa quando o gatilho fica no segmento anterior e a referência embutida sozinha no atual', async () => {
      const { navigation, service } = createService();

      const first = await service.identify('vamos abrir em');

      expect(first).toMatchObject({
        command: { type: CommandType.UNKNOWN },
        intentDecision: 'ignore',
      });
      expect(navigation.apply).not.toHaveBeenCalled();

      // Texto embutido (não começa com o livro) para que o segmento sozinho
      // realmente dependa da junção — uma referência direta já executaria
      // de qualquer forma, sem precisar do gatilho do segmento anterior.
      const second = await service.identify(
        'sabe aquele texto apocalipse 12 13',
      );

      expect(second).toEqual({
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
      expect(navigation.apply).toHaveBeenCalledTimes(1);
      expect(navigation.apply).toHaveBeenCalledWith({
        ...second.command,
        confidence: 1,
      });
    });

    it('executa quando o número fica separado do livro pelo corte do segmento', async () => {
      const { navigation, service } = createService();

      await service.identify('vamos para apocalipse capítulo');
      const second = await service.identify('12 13');

      expect(second).toMatchObject({
        command: {
          type: CommandType.BIBLE_REFERENCE,
          book: 'apocalipse',
          chapter: 12,
          verse: 13,
        },
        intentDecision: 'execute',
        intentReason: 'explicit_action',
      });
      expect(navigation.apply).toHaveBeenCalledTimes(1);
    });

    it('não combina dois segmentos comuns em um comando falso', async () => {
      const { navigation, service } = createService();

      await service.identify('que benção maravilhosa vivemos hoje');
      const second = await service.identify('vamos orar juntos agora');

      expect(second).toMatchObject({
        command: { type: CommandType.UNKNOWN },
        intentDecision: 'ignore',
        intentReason: 'unknown_or_unsafe',
      });
      expect(navigation.apply).not.toHaveBeenCalled();
    });

    it('mantém a confirmação por repetição quando a junção de borda não ajuda', async () => {
      const { navigation, service } = createService();
      const embedded = 'sabe aquele texto apocalipse 12 13';

      await service.identify('olá igreja');
      const second = await service.identify(embedded);

      expect(second).toMatchObject({
        intentDecision: 'ignore',
        intentReason: 'unknown_or_unsafe',
      });

      const third = await service.identify(embedded);

      expect(third).toMatchObject({
        intentDecision: 'execute',
        intentReason: 'repeated_reference',
      });
      expect(navigation.apply).toHaveBeenCalledTimes(1);
    });

    it('não junta com um segmento anterior que já foi executado', async () => {
      const { navigation, service } = createService();

      await service.identify('vamos para João 3 16');
      const second = await service.identify('vinte e três');

      expect(second).toMatchObject({
        command: { type: CommandType.UNKNOWN },
        intentDecision: 'ignore',
      });
      expect(navigation.apply).toHaveBeenCalledTimes(1);
    });
  });
});
