import type { HolyricsBibleProjectionService } from '../services/holyrics-bible-projection.service';
import { HolyricsBibleProjectionController } from './holyrics-bible-projection.controller';

describe('HolyricsBibleProjectionController', () => {
  it('expõe somente o último status seguro', () => {
    const status = {
      reference: 'João 3:16',
      version: 'NVI',
      delivery: 'holyrics' as const,
      deliveredToHolyrics: true,
      message: 'Passagem enviada ao Holyrics.',
      error: null,
      attemptedAt: '2026-06-20T00:00:00.000Z',
    };
    const service = {
      getStatus: jest.fn(() => status),
    } as unknown as jest.Mocked<HolyricsBibleProjectionService>;
    const controller = new HolyricsBibleProjectionController(service);

    expect(controller.getStatus()).toBe(status);
  });
});
