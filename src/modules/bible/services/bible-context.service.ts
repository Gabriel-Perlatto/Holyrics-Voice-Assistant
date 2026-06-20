import { Injectable } from '@nestjs/common';
import { DEFAULT_BIBLE_VERSION_ID } from '../data/versions';
import type { BibleContext } from '../interfaces/bible-content.interface';

@Injectable()
export class BibleContextService {
  private readonly context: BibleContext = {
    versionId: DEFAULT_BIBLE_VERSION_ID,
    bookId: null,
    chapter: null,
    verse: null,
  };

  getContext(): BibleContext {
    return { ...this.context };
  }
}
