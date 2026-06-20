import { RealtimeEventType } from '../enums/realtime-event-type.enum';
import { RealtimeGateway } from './realtime.gateway';

describe('RealtimeGateway', () => {
  it('transmite o evento usando seu tipo como canal', () => {
    const gateway = new RealtimeGateway();
    const server = {
      emit: jest.fn(),
    };
    const event = {
      type: RealtimeEventType.SETTINGS_UPDATED,
      payload: {
        holyricsConfigured: true,
        holyricsApiTokenConfigured: true,
        language: 'pt-BR',
        microphoneConfigured: false,
        voskModelConfigured: false,
        speechAutoStart: false,
        updatedAt: '2026-06-20T00:00:00.000Z',
      },
      occurredAt: '2026-06-20T00:00:00.000Z',
    };

    (
      gateway as unknown as {
        server: { emit: jest.Mock };
      }
    ).server = server;

    gateway.broadcast(event);

    expect(server.emit).toHaveBeenCalledWith(
      RealtimeEventType.SETTINGS_UPDATED,
      event,
    );
  });
});
