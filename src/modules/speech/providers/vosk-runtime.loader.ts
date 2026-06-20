import { Injectable } from '@nestjs/common';
import type {
  VoskRuntime,
  VoskRuntimeLoader,
} from '../interfaces/vosk-runtime.interface';

@Injectable()
export class NodeVoskRuntimeLoader implements VoskRuntimeLoader {
  load(): VoskRuntime {
    try {
      return require('vosk') as VoskRuntime;
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : 'erro desconhecido';

      throw new Error(
        `A biblioteca Vosk não pôde ser carregada: ${detail}`,
      );
    }
  }
}
