import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import type { HolyricsConnectionResult } from '../interfaces/holyrics-connection.interface';
import { HolyricsService } from '../services/holyrics.service';

@Controller('api/holyrics')
export class HolyricsController {
  constructor(private readonly holyricsService: HolyricsService) {}

  @Post('test-connection')
  @HttpCode(HttpStatus.OK)
  testConnection(): Promise<HolyricsConnectionResult> {
    return this.holyricsService.testConnection();
  }
}
