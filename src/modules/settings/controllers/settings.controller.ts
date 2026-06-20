import { Body, Controller, Get, Put } from '@nestjs/common';
import type { UpdateSettingsDto } from '../dto/update-settings.dto';
import type { PublicSettings } from '../interfaces/settings.interface';
import { SettingsService } from '../services/settings.service';

@Controller('api/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings(): PublicSettings {
    return this.settingsService.getPublicSettings();
  }

  @Put()
  updateSettings(@Body() input: UpdateSettingsDto): PublicSettings {
    return this.settingsService.updateSettings(input);
  }
}
