import { RealtimeEventType } from '../../realtime/enums/realtime-event-type.enum';
import type { RealtimeService } from '../../realtime/services/realtime.service';
import type { BibleNavigationService } from '../../bible/services/bible-navigation.service';
import { CommandType } from '../enums/command-type.enum';
import { PtBrCommandParser } from '../parsers/pt-br-command.parser';
import { CommandContextService } from '../services/command-context.service';
import { CommandService } from '../services/command.service';
import { NumberNormalizerService } from '../services/number-normalizer.service';

describe('CommandService', () => {
  const createService = () => {
    const realtime = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<RealtimeService>;
    const context = new CommandContextService();
    const navigation = {
      apply: jest.fn(),
    } as unknown as jest.Mocked<BibleNavigationService>;
    const service = new CommandService(
      new PtBrCommandParser(),
      new NumberNormalizerService(),
      context,
      realtime,
      navigation,
    );

    return { realtime, navigation, service };
  };

  it('identifica, emite e encaminha uma referência para navegação', () => {
    const { realtime, navigation, service } = createService();

    const command = service.identify('João 3 16');

    expect(command).toEqual({
      type: CommandType.BIBLE_REFERENCE,
      book: 'joao',
      chapter: 3,
      verse: 16,
      confidence: 1,
    });
    expect(realtime.emit).toHaveBeenCalledTimes(1);
    expect(realtime.emit).toHaveBeenCalledWith(
      RealtimeEventType.COMMAND_IDENTIFIED,
      command,
    );
    expect(realtime.emit).not.toHaveBeenCalledWith(
      RealtimeEventType.COMMAND_EXECUTED,
      expect.anything(),
    );
    expect(navigation.apply).toHaveBeenCalledWith(command);
  });

  it('mantém somente contexto interno para uso futuro', () => {
    const { service } = createService();

    service.identify('Romanos 8 1');

    expect(service.getStatus()).toEqual({
      lastTranscription: 'Romanos 8 1',
      lastNormalizedTranscription: 'Romanos 8 1',
      lastCommand: {
        type: CommandType.BIBLE_REFERENCE,
        book: 'romanos',
        chapter: 8,
        verse: 1,
        confidence: 1,
      },
      context: {
        book: 'romanos',
        chapter: 8,
        verse: 1,
      },
    });
  });

  it('normaliza números antes de interpretar e preserva o original', () => {
    const { service } = createService();

    const command = service.identify(
      'Primeira Coríntios capítulo dois versículo quatro',
    );

    expect(command).toEqual({
      type: CommandType.BIBLE_REFERENCE,
      book: '1-corintios',
      chapter: 2,
      verse: 4,
      confidence: 1,
    });
    expect(service.getStatus()).toEqual(
      expect.objectContaining({
        lastTranscription:
          'Primeira Coríntios capítulo dois versículo quatro',
        lastNormalizedTranscription:
          '1 Coríntios capítulo 2 versículo 4',
      }),
    );
  });

  it.each([
    [
      'João capítulo três versículo dezesseis',
      'joao',
      3,
      16,
    ],
    [
      'João três dezesseis',
      'joao',
      3,
      16,
    ],
    [
      'Segundo Samuel capítulo vinte e dois versículo três',
      '2-samuel',
      22,
      3,
    ],
    [
      'Salmos cento e cinquenta versículo seis',
      'salmos',
      150,
      6,
    ],
  ])(
    'interpreta referência completa normalizada: "%s"',
    (input, book, chapter, verse) => {
      const { service } = createService();

      expect(service.identify(input)).toEqual({
        type: CommandType.BIBLE_REFERENCE,
        book,
        chapter,
        verse,
        confidence: 1,
      });
    },
  );

  it.each([
    [
      'gênesis',
      'genesis',
      null,
    ],
    [
      'gênesis capítulo um',
      'genesis',
      1,
    ],
    [
      'joão capítulo três',
      'joao',
      3,
    ],
    [
      'joão três',
      'joao',
      3,
    ],
    [
      'primeira coríntios capítulo treze',
      '1-corintios',
      13,
    ],
    [
      'salmos cento e cinquenta',
      'salmos',
      150,
    ],
  ])(
    'interpreta referência parcial normalizada: "%s"',
    (input, book, chapter) => {
      const { service } = createService();

      expect(service.identify(input)).toEqual({
        type: CommandType.BIBLE_REFERENCE,
        book,
        chapter,
        verse: chapter === null ? null : 1,
        confidence: 1,
      });
    },
  );

  it('mantém frase comum sem referência como UNKNOWN', () => {
    const { service } = createService();

    expect(service.identify('vamos estudar um texto hoje')).toEqual({
      type: CommandType.UNKNOWN,
      confidence: 0,
    });
  });

  it('mantém comandos já suportados sem alteração', () => {
    const { service } = createService();

    expect(service.identify('próximo versículo')).toEqual({
      type: CommandType.NEXT_VERSE,
      confidence: 1,
    });
    expect(service.getStatus().lastNormalizedTranscription).toBe(
      'próximo versículo',
    );
  });

  it('emite UNKNOWN com confiança zero para texto inválido', () => {
    const { realtime, service } = createService();

    const command = service.identify('o próximo irmão');

    expect(command).toEqual({
      type: CommandType.UNKNOWN,
      confidence: 0,
    });
    expect(realtime.emit).toHaveBeenCalledWith(
      RealtimeEventType.COMMAND_IDENTIFIED,
      command,
    );
  });

  it('não inclui a transcrição no payload realtime', () => {
    const { realtime, service } = createService();

    service.identify('próximo');

    const payload = realtime.emit.mock.calls[0][1];
    expect(payload).toEqual({
      type: CommandType.NEXT_VERSE,
      confidence: 1,
    });
    expect(payload).not.toHaveProperty('text');
    expect(payload).not.toHaveProperty('transcription');
  });
});
