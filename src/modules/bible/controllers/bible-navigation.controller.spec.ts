import { CommandType } from '../../command/enums/command-type.enum';
import type { BibleNavigationService } from '../services/bible-navigation.service';
import { BibleNavigationController } from './bible-navigation.controller';

describe('BibleNavigationController', () => {
  it('expõe o diagnóstico de navegação', () => {
    const status = {
      context: {
        versionId: 'nvi',
        bookId: 'joao',
        chapter: 3,
        verse: 16,
      },
      currentReference: 'João 3:16 (NVI)',
      lastAppliedCommand: {
        type: CommandType.NEXT_VERSE,
        confidence: 1,
      },
    };
    const service = {
      getStatus: jest.fn(() => status),
    } as unknown as jest.Mocked<BibleNavigationService>;
    const controller = new BibleNavigationController(service);

    expect(controller.getStatus()).toBe(status);
    expect(service.getStatus).toHaveBeenCalledTimes(1);
  });
});
