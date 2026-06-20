import { Module } from '@nestjs/common';
import { CommandController } from './controllers/command.controller';
import { PtBrCommandParser } from './parsers/pt-br-command.parser';
import { CommandContextService } from './services/command-context.service';
import { CommandService } from './services/command.service';

@Module({
  controllers: [CommandController],
  providers: [
    PtBrCommandParser,
    CommandContextService,
    CommandService,
  ],
  exports: [CommandService],
})
export class CommandModule {}
