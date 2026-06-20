import { Injectable, Logger } from '@nestjs/common';
import { RealtimeEventType } from '../enums/realtime-event-type.enum';
import { RealtimeGateway } from '../gateways/realtime.gateway';
import type {
  RealtimeEvent,
  RealtimeEventPayloadMap,
  SystemErrorPayload,
} from '../interfaces/realtime-event.interface';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);

  constructor(private readonly realtimeGateway: RealtimeGateway) {}

  emit<T extends RealtimeEventType>(
    type: T,
    payload: RealtimeEventPayloadMap[T],
  ): RealtimeEvent<T> {
    const event: RealtimeEvent<T> = {
      type,
      payload,
      occurredAt: new Date().toISOString(),
    };

    this.realtimeGateway.broadcast(event);
    return event;
  }

  emitSystemError(payload: SystemErrorPayload): RealtimeEvent {
    this.logger.error(`${payload.source}: ${payload.message}`);

    return this.emit(RealtimeEventType.SYSTEM_ERROR, payload);
  }
}
