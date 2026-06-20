import { Body, Controller, Get, Put } from '@nestjs/common';
import type { UpdateSettingsDto } from '../dto/update-settings.dto';
import type { Settings } from '../interfaces/settings.interface';
import { SettingsService } from '../services/settings.service';

@Controller('api/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings(): Settings {
    return this.settingsService.getSettings();
  }

  @Put()
  updateSettings(@Body() input: UpdateSettingsDto): Settings {
    return this.settingsService.updateSettings(input);
  }
}
