import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { HolyricsController } from './controllers/holyrics.controller';
import {
  HOLYRICS_PROVIDER,
} from './interfaces/holyrics-provider.interface';
import { httpClientProvider } from './providers/http-client.provider';
import { HttpHolyricsProvider } from './providers/http-holyrics.provider';
import { HolyricsService } from './services/holyrics.service';

@Module({
  imports: [SettingsModule],
  controllers: [HolyricsController],
  providers: [
    httpClientProvider,
    HttpHolyricsProvider,
    {
      provide: HOLYRICS_PROVIDER,
      useExisting: HttpHolyricsProvider,
    },
    HolyricsService,
  ],
  exports: [HolyricsService],
})
export class HolyricsModule {}
