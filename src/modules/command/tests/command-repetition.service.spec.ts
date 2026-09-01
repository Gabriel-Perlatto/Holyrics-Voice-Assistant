import { CommandType } from '../enums/command-type.enum';
import type { BibleReferenceCommand } from '../interfaces/command.interface';
import { CommandRepetitionService } from '../services/command-repetition.service';

describe('CommandRepetitionService', () => {
  const reference: BibleReferenceCommand = {
    type: CommandType.BIBLE_REFERENCE,
    book: 'apocalipse',
    chapter: 12,
    verse: 13,
  };

  afterEach(() => {
    jest.useRealTimers();
  });

  it('não confirma antes de uma referência ser ignorada', () => {
    const service = new CommandRepetitionService();

    expect(service.isRepetition(reference)).toBe(false);
  });

  it('confirma a mesma referência repetida', () => {
    const service = new CommandRepetitionService();

    service.rememberIgnored(reference);

    expect(service.isRepetition(reference)).toBe(true);
  });

  it('não confirma uma referência diferente', () => {
    const service = new CommandRepetitionService();

    service.rememberIgnored(reference);

    expect(
      service.isRepetition({
        type: CommandType.BIBLE_REFERENCE,
        book: 'joao',
        chapter: 3,
        verse: 16,
      }),
    ).toBe(false);
  });

  it('confirma o refinamento de capítulo para versículo específico', () => {
    const service = new CommandRepetitionService();

    service.rememberIgnored({
      type: CommandType.BIBLE_REFERENCE,
      book: 'apocalipse',
      chapter: 12,
      verse: 1,
    });

    expect(service.isRepetition(reference)).toBe(true);
  });

  it('não confirma fora da janela de tempo', () => {
    jest.useFakeTimers();
    const service = new CommandRepetitionService();

    service.rememberIgnored(reference);
    jest.advanceTimersByTime(9000);

    expect(service.isRepetition(reference)).toBe(false);
  });

  it('esquece a referência lembrada após clear()', () => {
    const service = new CommandRepetitionService();

    service.rememberIgnored(reference);
    service.clear();

    expect(service.isRepetition(reference)).toBe(false);
  });
});
