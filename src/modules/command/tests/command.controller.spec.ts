import { CommandController } from '../controllers/command.controller';
import { CommandType } from '../enums/command-type.enum';
import type { CommandService } from '../services/command.service';

describe('CommandController', () => {
  const service = {
    identify: jest.fn(() => ({
      type: CommandType.UNKNOWN,
      confidence: 0,
    })),
    getStatus: jest.fn(() => ({
      lastTranscription: null,
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
      lastCommand: null,
      context: { book: null, chapter: null, verse: null },
    });
  });

  it('repassa texto para interpretação', () => {
    controller.interpret({ text: 'próximo' });

    expect(service.identify).toHaveBeenCalledWith('próximo');
  });

  it('aceita corpo inválido sem lançar erro de conteúdo', () => {
    expect(() => controller.interpret({})).not.toThrow();
    expect(service.identify).toHaveBeenCalledWith(undefined);
  });
});
