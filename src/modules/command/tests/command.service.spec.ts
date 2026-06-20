import { RealtimeEventType } from '../../realtime/enums/realtime-event-type.enum';
import type { RealtimeService } from '../../realtime/services/realtime.service';
import { CommandType } from '../enums/command-type.enum';
import { PtBrCommandParser } from '../parsers/pt-br-command.parser';
import { CommandContextService } from '../services/command-context.service';
import { CommandService } from '../services/command.service';

describe('CommandService', () => {
  const createService = () => {
    const realtime = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<RealtimeService>;
    const context = new CommandContextService();
    const service = new CommandService(
      new PtBrCommandParser(),
      context,
      realtime,
    );

    return { realtime, service };
  };

  it('identifica e emite uma referência sem executar ações', () => {
    const { realtime, service } = createService();

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
  });

  it('mantém somente contexto interno para uso futuro', () => {
    const { service } = createService();

    service.identify('Romanos 8 1');

    expect(service.getStatus()).toEqual({
      lastTranscription: 'Romanos 8 1',
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
