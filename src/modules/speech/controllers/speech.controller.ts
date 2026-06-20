import { Controller, Get, Post } from '@nestjs/common';
import type {
  SpeechMicrophone,
  SpeechStatus,
} from '../interfaces/speech.interface';
import { SpeechService } from '../services/speech.service';

@Controller('api/speech')
export class SpeechController {
  constructor(private readonly speechService: SpeechService) {}

  @Get('status')
  getStatus(): SpeechStatus {
    return this.speechService.getStatus();
  }

  @Get('microphones')
  listMicrophones(): Promise<SpeechMicrophone[]> {
    return this.speechService.listMicrophones();
  }

  @Post('initialize')
  initialize(): Promise<SpeechStatus> {
    return this.speechService.initialize();
  }

  @Post('start')
  start(): Promise<SpeechStatus> {
    return this.speechService.start();
  }

  @Post('stop')
  stop(): Promise<SpeechStatus> {
    return this.speechService.stop();
  }
}
