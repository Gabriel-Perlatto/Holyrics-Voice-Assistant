import { Module } from '@nestjs/common';
import { SettingsController } from './controllers/settings.controller';
import { settingsDatabasePathProvider } from './providers/settings-database-path.provider';
import { SettingsRepository } from './repositories/settings.repository';
import { SettingsService } from './services/settings.service';

@Module({
  controllers: [SettingsController],
  providers: [
    settingsDatabasePathProvider,
    SettingsRepository,
    SettingsService,
  ],
  exports: [SettingsService],
})
export class SettingsModule {}
