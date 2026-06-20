import { Injectable } from '@nestjs/common';
import { BibleNavigationService } from '../../bible/services/bible-navigation.service';
import { RealtimeEventType } from '../../realtime/enums/realtime-event-type.enum';
import { RealtimeService } from '../../realtime/services/realtime.service';
import { SettingsService } from '../../settings/services/settings.service';
import { CommandType } from '../enums/command-type.enum';
import type {
  CommandStatus,
  CommandIdentification,
  IdentifiedCommand,
} from '../interfaces/command.interface';
import { PtBrCommandParser } from '../parsers/pt-br-command.parser';
import { CommandContextService } from './command-context.service';
import { CommandIntentGuardService } from './command-intent-guard.service';
import { NumberNormalizerService } from './number-normalizer.service';

@Injectable()
export class CommandService {
  private lastTranscription: string | null = null;
  private lastNormalizedTranscription: string | null = null;
  private lastCommand: CommandIdentification | null = null;

  constructor(
    private readonly parser: PtBrCommandParser,
    private readonly numberNormalizer: NumberNormalizerService,
    private readonly contextService: CommandContextService,
    private readonly realtimeService: RealtimeService,
    private readonly navigationService: BibleNavigationService,
    private readonly intentGuard: CommandIntentGuardService,
    private readonly settingsService: SettingsService,
  ) {}

  async identify(input: unknown): Promise<CommandIdentification> {
    const normalizedInput = this.numberNormalizer.normalize(input);
    const command = this.parser.parseTranscription(normalizedInput);
    const confidence =
      command.type === CommandType.UNKNOWN ? 0 : 1;
    const intent = this.intentGuard.decide(
      input,
      normalizedInput,
      command,
      this.settingsService.getSettings().voiceCommandMode ??
        'conservative',
    );
    const identification: CommandIdentification = {
      command,
      confidence,
      intentDecision: intent.decision,
      intentReason: intent.reason,
    };
    const identifiedCommand: IdentifiedCommand = {
      ...command,
      confidence,
    };

    this.lastTranscription =
      typeof input === 'string' ? input : null;
    this.lastNormalizedTranscription =
      typeof input === 'string' ? normalizedInput : null;
    this.lastCommand = identification;

    if (command.type === CommandType.BIBLE_REFERENCE) {
      this.contextService.rememberReference(command);
    }

    this.realtimeService.emit(
      RealtimeEventType.COMMAND_IDENTIFIED,
      identification,
    );

    if (intent.decision === 'execute') {
      await this.navigationService.apply(identifiedCommand);
    }

    return identification;
  }

  getStatus(): CommandStatus {
    return {
      lastTranscription: this.lastTranscription,
      lastNormalizedTranscription:
        this.lastNormalizedTranscription,
      lastCommand: this.lastCommand
        ? {
            ...this.lastCommand,
            command: { ...this.lastCommand.command },
          }
        : null,
      context: this.contextService.getContext(),
    };
  }
}
