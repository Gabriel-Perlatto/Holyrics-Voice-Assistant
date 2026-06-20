import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import type {
  BibleBooksResponse,
  BibleChaptersResponse,
  BibleSelectionResponse,
  BibleVersesResponse,
  BibleVersionsResponse,
} from '../interfaces/bible-content.interface';
import type {
  BibleBookParamsDto,
  BibleChapterParamsDto,
} from '../dto/bible-route-params.dto';
import type { SelectBiblePassageDto } from '../dto/select-bible-passage.dto';
import { BibleService } from '../services/bible.service';

@Controller('api/bible')
export class BibleController {
  constructor(private readonly bibleService: BibleService) {}

  @Get('versions')
  getVersions(): BibleVersionsResponse {
    return this.bibleService.getVersions();
  }

  @Get('books')
  getBooks(): BibleBooksResponse {
    return this.bibleService.getBooks();
  }

  @Get('books/:book/chapters')
  getChapters(
    @Param() params: BibleBookParamsDto,
  ): BibleChaptersResponse {
    return this.bibleService.getChapters(params.book);
  }

  @Get('books/:book/chapters/:chapter/verses')
  getVerses(
    @Param() params: BibleChapterParamsDto,
  ): BibleVersesResponse {
    return this.bibleService.getVerses(params.book, params.chapter);
  }

  @Post('selection')
  @HttpCode(HttpStatus.OK)
  selectPassage(
    @Body() input: SelectBiblePassageDto,
  ): BibleSelectionResponse {
    return this.bibleService.selectPassage(input);
  }
}
