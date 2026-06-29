declare module 'node-nlp' {
  export interface NlpManagerOptions {
    languages: string[];
    forceNER?: boolean;
    autoSave?: boolean;
    modelFileName?: string;
    nlu?: {
      log?: boolean | ((message: string) => void);
      useNoneFeature?: boolean;
    };
  }

  export interface NlpClassification {
    intent: string;
    score: number;
  }

  export interface NlpProcessResult {
    intent: string;
    score: number;
    classifications?: NlpClassification[];
  }

  export class NlpManager {
    constructor(options: NlpManagerOptions);
    addDocument(locale: string, utterance: string, intent: string): void;
    train(): Promise<void>;
    process(locale: string, utterance: string): Promise<NlpProcessResult>;
  }
}
