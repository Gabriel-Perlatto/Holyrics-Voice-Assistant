import { CommandController } from '../controllers/command.controller';
import { CommandType } from '../enums/command-type.enum';
import type { CommandService } from '../services/command.service';

describe('CommandController', () => {
  const service = {
    identify: jest.fn(async () => ({
      command: { type: CommandType.UNKNOWN },
      confidence: 0,
      intentDecision: 'ignore',
      intentReason: 'unknown_or_unsafe',
    })),
    getStatus: jest.fn(() => ({
      lastTranscription: null,
      lastNormalizedTranscription: null,
      lastCommand: null,
      context: { book: null, chapter: null, verse: null },
    })),
  } as unknown as jest.Mocked<CommandService>;
  const controller = new CommandController(service);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('expõe o diagnóstico atual', () => {
    expect(controller.getStatus()).toEqual({
      lastTranscription: null,
      lastNormalizedTranscription: null,
      lastCommand: null,
      context: { book: null, chapter: null, verse: null },
    });
  });

  it('repassa texto para interpretação', async () => {
    await controller.interpret({ text: 'próximo' });

    expect(service.identify).toHaveBeenCalledWith('próximo');
  });

  it('aceita corpo inválido sem lançar erro de conteúdo', async () => {
    await expect(controller.interpret({})).resolves.toEqual(
      expect.objectContaining({
        command: { type: CommandType.UNKNOWN },
      }),
    );
    expect(service.identify).toHaveBeenCalledWith(undefined);
  });
});
