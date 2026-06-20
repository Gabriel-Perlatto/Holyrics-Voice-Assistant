import { RealtimeEventType } from '../enums/realtime-event-type.enum';
import type { RealtimeGateway } from '../gateways/realtime.gateway';
import { RealtimeService } from './realtime.service';

describe('RealtimeService', () => {
  const createGateway = (): jest.Mocked<RealtimeGateway> =>
    ({
      broadcast: jest.fn(),
    }) as unknown as jest.Mocked<RealtimeGateway>;

  it('cria e transmite um envelope padronizado', () => {
    const gateway = createGateway();
    const service = new RealtimeService(gateway);

    const event = service.emit(RealtimeEventType.BIBLE_CHANGED, {
      book: 'joao',
      chapter: 3,
      verse: 16,
      version: 'NVI',
      source: 'voice',
      delivery: 'local-only',
      deliveredToHolyrics: false,
    });

    expect(event).toEqual({
      type: RealtimeEventType.BIBLE_CHANGED,
      payload: expect.objectContaining({
        book: 'joao',
        chapter: 3,
        verse: 16,
      }),
      occurredAt: expect.any(String),
    });
    expect(gateway.broadcast).toHaveBeenCalledWith(event);
  });

  it('emite SYSTEM_ERROR sem alterar o payload', () => {
    const gateway = createGateway();
    const service = new RealtimeService(gateway);

    const event = service.emitSystemError({
      source: 'system',
      message: 'Falha controlada.',
    });

    expect(event.type).toBe(RealtimeEventType.SYSTEM_ERROR);
    expect(event.payload).toEqual({
      source: 'system',
      message: 'Falha controlada.',
    });
  });
});
