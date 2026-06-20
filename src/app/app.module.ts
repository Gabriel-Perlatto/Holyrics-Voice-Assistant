import { Module } from '@nestjs/common';
import { HolyricsModule } from '../modules/holyrics/holyrics.module';
import { SettingsModule } from '../modules/settings/settings.module';
import { SystemModule } from '../modules/system/system.module';
import { AppController } from './app.controller';

@Module({
  imports: [HolyricsModule, SettingsModule, SystemModule],
  controllers: [AppController],
})
export class AppModule {}
