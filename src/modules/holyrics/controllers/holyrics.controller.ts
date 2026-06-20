import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import type { CheckHolyricsPermissionsDto } from '../dto/check-holyrics-permissions.dto';
import type {
  HolyricsAuthenticationResult,
  HolyricsConnectionResult,
  HolyricsInformationResult,
  HolyricsPermissionCheckResult,
} from '../interfaces/holyrics-api.interface';
import { HolyricsService } from '../services/holyrics.service';

@Controller('api/holyrics')
export class HolyricsController {
  constructor(private readonly holyricsService: HolyricsService) {}

  @Post('test-connection')
  @HttpCode(HttpStatus.OK)
  testConnection(): Promise<HolyricsConnectionResult> {
    return this.holyricsService.testConnection();
  }

  @Post('authentication/validate')
  @HttpCode(HttpStatus.OK)
  validateAuthentication(): Promise<HolyricsAuthenticationResult> {
    return this.holyricsService.validateAuthentication();
  }

  @Post('info')
  @HttpCode(HttpStatus.OK)
  getApiInformation(): Promise<HolyricsInformationResult> {
    return this.holyricsService.getApiInformation();
  }

  @Post('permissions/check')
  @HttpCode(HttpStatus.OK)
  checkPermissions(
    @Body() input: CheckHolyricsPermissionsDto,
  ): Promise<HolyricsPermissionCheckResult> {
    return this.holyricsService.checkPermissions(input);
  }
}
