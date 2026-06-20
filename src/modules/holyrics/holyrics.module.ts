import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { HolyricsController } from './controllers/holyrics.controller';
import { HolyricsBibleProjectionController } from './controllers/holyrics-bible-projection.controller';
import {
  HOLYRICS_PROVIDER,
} from './interfaces/holyrics-provider.interface';
import { httpClientProvider } from './providers/http-client.provider';
import { HttpHolyricsProvider } from './providers/http-holyrics.provider';
import { HolyricsService } from './services/holyrics.service';
import { HolyricsBibleProjectionService } from './services/holyrics-bible-projection.service';

@Module({
  imports: [SettingsModule],
  controllers: [
    HolyricsController,
    HolyricsBibleProjectionController,
  ],
  providers: [
    httpClientProvider,
    HttpHolyricsProvider,
    {
      provide: HOLYRICS_PROVIDER,
      useExisting: HttpHolyricsProvider,
    },
    HolyricsService,
    HolyricsBibleProjectionService,
  ],
  exports: [HolyricsService, HolyricsBibleProjectionService],
})
export class HolyricsModule {}
