import type { CommandType } from '../enums/command-type.enum';

export interface BibleReferenceCommand {
  type: CommandType.BIBLE_REFERENCE;
  book: string;
  chapter: number | null;
  verse: number | null;
}

export interface NavigationCommand {
  type:
    | CommandType.NEXT_VERSE
    | CommandType.PREVIOUS_VERSE
    | CommandType.NEXT_CHAPTER
    | CommandType.PREVIOUS_CHAPTER;
}

export interface UnknownCommand {
  type: CommandType.UNKNOWN;
}

export type StructuredCommand =
  | BibleReferenceCommand
  | NavigationCommand
  | UnknownCommand;

export type IdentifiedCommand = StructuredCommand & {
  confidence: number;
};

export interface CommandContext {
  book: string | null;
  chapter: number | null;
  verse: number | null;
}

export interface CommandStatus {
  lastTranscription: string | null;
  lastNormalizedTranscription: string | null;
  lastCommand: IdentifiedCommand | null;
  context: CommandContext;
}
