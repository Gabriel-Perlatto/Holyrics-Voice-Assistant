import { Module } from '@nestjs/common';
import { BibleController } from './controllers/bible.controller';
import { BibleNavigationController } from './controllers/bible-navigation.controller';
import { BIBLE_CONTENT_PROVIDER } from './interfaces/bible-content-provider.interface';
import { LocalBibleContentProvider } from './providers/local-bible-content.provider';
import { BibleContextService } from './services/bible-context.service';
import { BibleNavigationService } from './services/bible-navigation.service';
import { BibleService } from './services/bible.service';
import { BookAliasService } from './services/book-alias.service';

@Module({
  controllers: [BibleController, BibleNavigationController],
  providers: [
    LocalBibleContentProvider,
    {
      provide: BIBLE_CONTENT_PROVIDER,
      useExisting: LocalBibleContentProvider,
    },
    BookAliasService,
    BibleContextService,
    BibleNavigationService,
    BibleService,
  ],
  exports: [
    BibleService,
    BibleContextService,
    BibleNavigationService,
  ],
})
export class BibleModule {}
