import { Module } from '@nestjs/common';
import { CommandModule } from '../command/command.module';
import { SettingsModule } from '../settings/settings.module';
import { SpeechController } from './controllers/speech.controller';
import { SPEECH_PROVIDER } from './interfaces/speech-provider.interface';
import {
  AUDIO_CAPTURE,
  VOSK_RUNTIME_LOADER,
} from './interfaces/vosk-runtime.interface';
import { FfmpegAudioCapture } from './providers/ffmpeg-audio-capture';
import { NodeVoskRuntimeLoader } from './providers/vosk-runtime.loader';
import { VoskSpeechProvider } from './providers/vosk-speech.provider';
import { SpeechService } from './services/speech.service';

@Module({
  imports: [CommandModule, SettingsModule],
  controllers: [SpeechController],
  providers: [
    FfmpegAudioCapture,
    NodeVoskRuntimeLoader,
    VoskSpeechProvider,
    {
      provide: AUDIO_CAPTURE,
      useExisting: FfmpegAudioCapture,
    },
    {
      provide: VOSK_RUNTIME_LOADER,
      useExisting: NodeVoskRuntimeLoader,
    },
    {
      provide: SPEECH_PROVIDER,
      useExisting: VoskSpeechProvider,
    },
    SpeechService,
  ],
  exports: [SpeechService],
})
export class SpeechModule {}
