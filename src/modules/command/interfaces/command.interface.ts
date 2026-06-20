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

export type CommandIntentDecision = 'execute' | 'ignore';

export type CommandIntentReason =
  | 'explicit_action'
  | 'casual_reference'
  | 'relative_reference_context'
  | 'unknown_or_unsafe';

export interface CommandIntentGuardDecision {
  decision: CommandIntentDecision;
  reason: CommandIntentReason;
}

export interface CommandIdentification {
  command: StructuredCommand;
  confidence: number;
  intentDecision: CommandIntentDecision;
  intentReason: CommandIntentReason;
}

export interface CommandContext {
  book: string | null;
  chapter: number | null;
  verse: number | null;
}

export interface CommandStatus {
  lastTranscription: string | null;
  lastNormalizedTranscription: string | null;
  lastCommand: CommandIdentification | null;
  context: CommandContext;
}
