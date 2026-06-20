import { Module } from '@nestjs/common';
import { SettingsController } from './controllers/settings.controller';
import { settingsDatabasePathProvider } from './providers/settings-database-path.provider';
import { SettingsRepository } from './repositories/settings.repository';
import { ModelPathService } from './services/model-path.service';
import { SettingsService } from './services/settings.service';

@Module({
  controllers: [SettingsController],
  providers: [
    settingsDatabasePathProvider,
    SettingsRepository,
    ModelPathService,
    SettingsService,
  ],
  exports: [SettingsService],
})
export class SettingsModule {}
