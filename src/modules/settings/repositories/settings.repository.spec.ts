import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SettingsRepository } from './settings.repository';

describe('SettingsRepository', () => {
  let temporaryDirectory: string;
  let databasePath: string;

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'hva-settings-'));
    databasePath = join(temporaryDirectory, 'settings.sqlite');
  });

  afterEach(() => {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  it('cria configurações padrão', () => {
    const repository = new SettingsRepository(databasePath);

    expect(repository.find()).toEqual(
      expect.objectContaining({
        holyricsHost: '',
        holyricsPort: null,
        language: 'pt-BR',
        microphone: null,
        voskModelPath: null,
      }),
    );

    repository.onModuleDestroy();
  });

  it('mantém configurações após reabrir o banco', () => {
    const firstRepository = new SettingsRepository(databasePath);

    firstRepository.save({
      holyricsHost: '192.168.1.30',
      holyricsPort: 8091,
      language: 'pt-BR',
      microphone: 'Microfone principal',
      voskModelPath: '/modelos/vosk',
    });
    firstRepository.onModuleDestroy();

    const secondRepository = new SettingsRepository(databasePath);

    expect(secondRepository.find()).toEqual(
      expect.objectContaining({
        holyricsHost: '192.168.1.30',
        holyricsPort: 8091,
        language: 'pt-BR',
        microphone: 'Microfone principal',
        voskModelPath: '/modelos/vosk',
      }),
    );

    secondRepository.onModuleDestroy();
  });
});
