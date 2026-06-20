import { Module } from '@nestjs/common';
import { SettingsModule } from '../modules/settings/settings.module';
import { SystemModule } from '../modules/system/system.module';
import { AppController } from './app.controller';

@Module({
  imports: [SettingsModule, SystemModule],
  controllers: [AppController],
})
export class AppModule {}
