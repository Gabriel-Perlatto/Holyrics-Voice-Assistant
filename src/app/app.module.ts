import { Module } from '@nestjs/common';
import { BibleModule } from '../modules/bible/bible.module';
import { HolyricsModule } from '../modules/holyrics/holyrics.module';
import { RealtimeModule } from '../modules/realtime/realtime.module';
import { SettingsModule } from '../modules/settings/settings.module';
import { SpeechModule } from '../modules/speech/speech.module';
import { SystemModule } from '../modules/system/system.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    RealtimeModule,
    BibleModule,
    HolyricsModule,
    SettingsModule,
    SpeechModule,
    SystemModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
