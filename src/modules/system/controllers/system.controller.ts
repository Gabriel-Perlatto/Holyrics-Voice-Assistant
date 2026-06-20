import { Controller, Get } from '@nestjs/common';
import type { SystemStatus } from '../interfaces/system-status.interface';
import { SystemService } from '../services/system.service';

@Controller('api/system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('status')
  getStatus(): SystemStatus {
    return this.systemService.getStatus();
  }
}
