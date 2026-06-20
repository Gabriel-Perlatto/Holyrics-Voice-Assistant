import { Module } from '@nestjs/common';
import { BibleModule } from '../bible/bible.module';
import { CommandController } from './controllers/command.controller';
import { PtBrCommandParser } from './parsers/pt-br-command.parser';
import { CommandContextService } from './services/command-context.service';
import { CommandService } from './services/command.service';
import { NumberNormalizerService } from './services/number-normalizer.service';

@Module({
  imports: [BibleModule],
  controllers: [CommandController],
  providers: [
    PtBrCommandParser,
    NumberNormalizerService,
    CommandContextService,
    CommandService,
  ],
  exports: [CommandService],
})
export class CommandModule {}
