import { Injectable } from '@nestjs/common';
import { NlpManager } from 'node-nlp';
import type { CommandIntentReason } from '../interfaces/command.interface';
import type {
  CommandIntentTrainingIntent,
  CommandIntentTrainingProfile,
} from '../nlp/intent-training.interface';
import { PT_BR_COMMAND_INTENT_TRAINING } from '../nlp/pt-br-intent-training';

export interface CommandIntentClassification {
  decision: 'execute' | 'ignore';
  reason: CommandIntentReason;
  score: number;
  intent: CommandIntentTrainingIntent | 'None';
}

const MINIMUM_CLASSIFICATION_SCORE = 0.62;

@Injectable()
export class CommandIntentClassifierService {
  private readonly profiles = new Map<
    string,
    CommandIntentTrainingProfile
  >([[PT_BR_COMMAND_INTENT_TRAINING.language, PT_BR_COMMAND_INTENT_TRAINING]]);
  private readonly managers = new Map<string, NlpManager>();
  private readonly training = new Map<string, Promise<NlpManager>>();

  async classify(
    language: string,
    text: string,
  ): Promise<CommandIntentClassification | null> {
    const profile = this.getProfile(language);

    if (!profile || !text.trim()) {
      return null;
    }

    const manager = await this.getManager(profile);
    const result = await manager.process(profile.locale, text);
    const intent = result.intent as
      | CommandIntentTrainingIntent
      | 'None';
    const score = result.score ?? 0;

    if (score < MINIMUM_CLASSIFICATION_SCORE) {
      return null;
    }

    return this.toClassification(intent, score);
  }

  private getProfile(
    language: string,
  ): CommandIntentTrainingProfile | undefined {
    return (
      this.profiles.get(language) ??
      this.profiles.get(language.split('-')[0]) ??
      this.profiles.get('pt-BR')
    );
  }

  private getManager(
    profile: CommandIntentTrainingProfile,
  ): Promise<NlpManager> {
    const trainedManager = this.managers.get(profile.language);

    if (trainedManager) {
      return Promise.resolve(trainedManager);
    }

    const currentTraining = this.training.get(profile.language);

    if (currentTraining) {
      return currentTraining;
    }

    const training = this.train(profile);
    this.training.set(profile.language, training);

    return training;
  }

  private async train(
    profile: CommandIntentTrainingProfile,
  ): Promise<NlpManager> {
    const manager = new NlpManager({
      languages: [profile.locale],
      forceNER: true,
      autoSave: false,
      nlu: { log: false },
    });

    for (const document of profile.documents) {
      manager.addDocument(
        profile.locale,
        document.utterance,
        document.intent,
      );
    }

    await manager.train();
    this.managers.set(profile.language, manager);
    this.training.delete(profile.language);

    return manager;
  }

  private toClassification(
    intent: CommandIntentTrainingIntent | 'None',
    score: number,
  ): CommandIntentClassification | null {
    if (intent === 'navigation.execute') {
      return {
        decision: 'execute',
        reason: 'explicit_action',
        score,
        intent,
      };
    }

    if (intent === 'navigation.ignore.casual_reference') {
      return {
        decision: 'ignore',
        reason: 'casual_reference',
        score,
        intent,
      };
    }

    if (intent === 'navigation.ignore.relative_reference_context') {
      return {
        decision: 'ignore',
        reason: 'relative_reference_context',
        score,
        intent,
      };
    }

    if (intent === 'navigation.ignore.direct_reference') {
      return {
        decision: 'ignore',
        reason: 'unknown_or_unsafe',
        score,
        intent,
      };
    }

    return null;
  }
}
