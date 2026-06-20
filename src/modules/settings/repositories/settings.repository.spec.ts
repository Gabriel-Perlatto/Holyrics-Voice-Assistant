import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import Database = require('better-sqlite3');
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
        holyricsApiToken: null,
        language: 'pt-BR',
        microphone: null,
        voskModelPath: null,
        speechAutoStart: false,
      }),
    );

    repository.onModuleDestroy();
  });

  it('mantém configurações após reabrir o banco', () => {
    const firstRepository = new SettingsRepository(databasePath);

    firstRepository.save({
      holyricsHost: '192.168.1.30',
      holyricsPort: 8091,
      holyricsApiToken: 'secret-token',
      language: 'pt-BR',
      microphone: 'Microfone principal',
      voskModelPath: '/modelos/vosk',
      speechAutoStart: true,
    });
    firstRepository.onModuleDestroy();

    const secondRepository = new SettingsRepository(databasePath);

    expect(secondRepository.find()).toEqual(
      expect.objectContaining({
        holyricsHost: '192.168.1.30',
        holyricsPort: 8091,
        holyricsApiToken: 'secret-token',
        language: 'pt-BR',
        microphone: 'Microfone principal',
        voskModelPath: '/modelos/vosk',
        speechAutoStart: true,
      }),
    );

    secondRepository.onModuleDestroy();
  });

  it('migra bancos existentes sem perder configurações', () => {
    const legacyDatabase = new Database(databasePath);

    legacyDatabase.exec(`
      CREATE TABLE settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        holyrics_host TEXT NOT NULL,
        holyrics_port INTEGER,
        language TEXT NOT NULL,
        microphone TEXT,
        vosk_model_path TEXT,
        updated_at TEXT NOT NULL
      );

      INSERT INTO settings (
        id,
        holyrics_host,
        holyrics_port,
        language,
        microphone,
        vosk_model_path,
        updated_at
      ) VALUES (
        1,
        '192.168.1.40',
        8091,
        'pt-BR',
        NULL,
        NULL,
        '2026-06-20T00:00:00.000Z'
      );
    `);
    legacyDatabase.close();

    const repository = new SettingsRepository(databasePath);

    expect(repository.find()).toEqual(
      expect.objectContaining({
        holyricsHost: '192.168.1.40',
        holyricsPort: 8091,
        holyricsApiToken: null,
        speechAutoStart: false,
      }),
    );

    repository.onModuleDestroy();
  });
});
