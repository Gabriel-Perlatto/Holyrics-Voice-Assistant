import type { IdentifiedCommand } from '../../command/interfaces/command.interface';
import type { BibleContext } from './bible-content.interface';

export interface BibleNavigationStatus {
  context: BibleContext;
  currentReference: string | null;
  lastAppliedCommand: IdentifiedCommand | null;
}
