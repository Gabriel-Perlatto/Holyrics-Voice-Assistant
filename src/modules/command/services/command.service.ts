import { Injectable } from '@nestjs/common';
import { RealtimeEventType } from '../../realtime/enums/realtime-event-type.enum';
import { RealtimeService } from '../../realtime/services/realtime.service';
import { CommandType } from '../enums/command-type.enum';
import type {
  CommandStatus,
  IdentifiedCommand,
} from '../interfaces/command.interface';
import { PtBrCommandParser } from '../parsers/pt-br-command.parser';
import { CommandContextService } from './command-context.service';

@Injectable()
export class CommandService {
  private lastTranscription: string | null = null;
  private lastCommand: IdentifiedCommand | null = null;

  constructor(
    private readonly parser: PtBrCommandParser,
    private readonly contextService: CommandContextService,
    private readonly realtimeService: RealtimeService,
  ) {}

  identify(input: unknown): IdentifiedCommand {
    const command = this.parser.parse(input);
    const identifiedCommand: IdentifiedCommand = {
      ...command,
      confidence: command.type === CommandType.UNKNOWN ? 0 : 1,
    };

    this.lastTranscription =
      typeof input === 'string' ? input : null;
    this.lastCommand = identifiedCommand;

    if (command.type === CommandType.BIBLE_REFERENCE) {
      this.contextService.rememberReference(command);
    }

    this.realtimeService.emit(
      RealtimeEventType.COMMAND_IDENTIFIED,
      identifiedCommand,
    );

    return identifiedCommand;
  }

  getStatus(): CommandStatus {
    return {
      lastTranscription: this.lastTranscription,
      lastCommand: this.lastCommand
        ? { ...this.lastCommand }
        : null,
      context: this.contextService.getContext(),
    };
  }
}
