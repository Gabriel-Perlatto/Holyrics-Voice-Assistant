export interface BibleBookParamsDto {
  book: string;
}

export interface BibleChapterParamsDto extends BibleBookParamsDto {
  chapter: string;
}
