import { Controller, Get } from '@nestjs/common';
import type { HolyricsBibleProjectionResult } from '../interfaces/holyrics-bible-projection.interface';
import { HolyricsBibleProjectionService } from '../services/holyrics-bible-projection.service';

@Controller('api/holyrics/bible-projection')
export class HolyricsBibleProjectionController {
  constructor(
    private readonly projectionService: HolyricsBibleProjectionService,
  ) {}

  @Get('status')
  getStatus(): HolyricsBibleProjectionResult | null {
    return this.projectionService.getStatus();
  }
}
