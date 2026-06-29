export type CommandIntentTrainingIntent =
  | 'navigation.execute'
  | 'navigation.ignore.casual_reference'
  | 'navigation.ignore.relative_reference_context'
  | 'navigation.ignore.direct_reference';

export interface CommandIntentTrainingDocument {
  utterance: string;
  intent: CommandIntentTrainingIntent;
}

export interface CommandIntentTrainingProfile {
  language: string;
  locale: string;
  documents: CommandIntentTrainingDocument[];
}
