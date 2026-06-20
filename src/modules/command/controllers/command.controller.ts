import { Body, Controller, Get, Post } from '@nestjs/common';
import { InterpretCommandDto } from '../dto/interpret-command.dto';
import type {
  CommandStatus,
  CommandIdentification,
} from '../interfaces/command.interface';
import { CommandService } from '../services/command.service';

@Controller('api/commands')
export class CommandController {
  constructor(private readonly commandService: CommandService) {}

  @Get('status')
  getStatus(): CommandStatus {
    return this.commandService.getStatus();
  }

  @Post('interpret')
  interpret(
    @Body() input: InterpretCommandDto,
  ): Promise<CommandIdentification> {
    return this.commandService.identify(input?.text);
  }
}
