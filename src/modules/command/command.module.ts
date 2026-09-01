import { Module } from '@nestjs/common';
import { BibleModule } from '../bible/bible.module';
import { SettingsModule } from '../settings/settings.module';
import { CommandController } from './controllers/command.controller';
import { PtBrCommandParser } from './parsers/pt-br-command.parser';
import { CommandContextService } from './services/command-context.service';
import { CommandIntentGuardService } from './services/command-intent-guard.service';
import { CommandIntentSignalsService } from './services/command-intent-signals.service';
import { CommandService } from './services/command.service';
import { NumberNormalizerService } from './services/number-normalizer.service';
import { TranscriptionCorrectionService } from './services/transcription-correction.service';

@Module({
  imports: [BibleModule, SettingsModule],
  controllers: [CommandController],
  providers: [
    PtBrCommandParser,
    NumberNormalizerService,
    TranscriptionCorrectionService,
    CommandContextService,
    CommandIntentSignalsService,
    CommandIntentGuardService,
    CommandService,
  ],
  exports: [CommandService],
})
export class CommandModule {}
