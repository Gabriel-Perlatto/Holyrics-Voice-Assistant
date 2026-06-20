import { Module } from '@nestjs/common';
import { BibleModule } from '../modules/bible/bible.module';
import { CommandModule } from '../modules/command/command.module';
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
    CommandModule,
    HolyricsModule,
    SettingsModule,
    SpeechModule,
    SystemModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
