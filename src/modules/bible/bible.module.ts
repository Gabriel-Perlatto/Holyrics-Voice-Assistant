import { Module } from '@nestjs/common';
import { BibleController } from './controllers/bible.controller';
import { BIBLE_CONTENT_PROVIDER } from './interfaces/bible-content-provider.interface';
import { LocalBibleContentProvider } from './providers/local-bible-content.provider';
import { BibleContextService } from './services/bible-context.service';
import { BibleService } from './services/bible.service';
import { BookAliasService } from './services/book-alias.service';

@Module({
  controllers: [BibleController],
  providers: [
    LocalBibleContentProvider,
    {
      provide: BIBLE_CONTENT_PROVIDER,
      useExisting: LocalBibleContentProvider,
    },
    BookAliasService,
    BibleContextService,
    BibleService,
  ],
  exports: [BibleService, BibleContextService],
})
export class BibleModule {}
