import { Injectable } from '@nestjs/common';
import { PT_BR_BIBLE_BOOKS } from '../data/pt-BR/books';
import type { BibleBook } from '../interfaces/bible-content.interface';

@Injectable()
export class BookAliasService {
  private readonly booksByAlias = new Map<string, BibleBook>();

  constructor() {
    for (const book of PT_BR_BIBLE_BOOKS) {
      const identifiers = [book.id, book.name, ...book.aliases];

      for (const identifier of identifiers) {
        this.booksByAlias.set(this.normalize(identifier), book);
      }
    }
  }

  resolve(identifier: string): BibleBook | undefined {
    return this.booksByAlias.get(this.normalize(identifier));
  }

  private normalize(value: string): string {
    return value
      .trim()
      .toLocaleLowerCase('pt-BR')
      .replace(/[._-]+/g, ' ')
      .replace(/\s+/g, ' ');
  }
}
