import { Controller, Get } from '@nestjs/common';
import type { BibleNavigationStatus } from '../interfaces/bible-navigation.interface';
import { BibleNavigationService } from '../services/bible-navigation.service';

@Controller('api/bible/navigation')
export class BibleNavigationController {
  constructor(
    private readonly navigationService: BibleNavigationService,
  ) {}

  @Get('status')
  getStatus(): BibleNavigationStatus {
    return this.navigationService.getStatus();
  }
}
