import { Injectable } from '@nestjs/common';
import type {
  BibleReferenceCommand,
  CommandContext,
} from '../interfaces/command.interface';

@Injectable()
export class CommandContextService {
  private context: CommandContext = {
    book: null,
    chapter: null,
    verse: null,
  };

  getContext(): CommandContext {
    return { ...this.context };
  }

  rememberReference(command: BibleReferenceCommand): void {
    this.context = {
      book: command.book,
      chapter: command.chapter,
      verse: command.verse,
    };
  }
}
