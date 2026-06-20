import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import Database = require('better-sqlite3');
import { dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import type { Settings } from '../interfaces/settings.interface';
import { SETTINGS_DATABASE_PATH } from '../providers/settings-database-path.provider';

interface SettingsRow {
  holyrics_host: string;
  holyrics_port: number | null;
  language: string;
  microphone: string | null;
  vosk_model_path: string | null;
  updated_at: string;
}

@Injectable()
export class SettingsRepository implements OnModuleDestroy {
  private readonly logger = new Logger(SettingsRepository.name);
  private readonly database: Database.Database;

  constructor(
    @Inject(SETTINGS_DATABASE_PATH) databasePath: string,
  ) {
    if (databasePath !== ':memory:') {
      mkdirSync(dirname(databasePath), { recursive: true });
    }

    this.database = new Database(databasePath);
    this.initialize();

    this.logger.log(`Configurações locais carregadas de ${databasePath}`);
  }

  find(): Settings {
    const row = this.database
      .prepare(
        `
          SELECT
            holyrics_host,
            holyrics_port,
            language,
            microphone,
            vosk_model_path,
            updated_at
          FROM settings
          WHERE id = 1
        `,
      )
      .get() as SettingsRow;

    return this.mapRow(row);
  }

  save(settings: Omit<Settings, 'updatedAt'>): Settings {
    const updatedAt = new Date().toISOString();

    this.database
      .prepare(
        `
          UPDATE settings
          SET
            holyrics_host = @holyricsHost,
            holyrics_port = @holyricsPort,
            language = @language,
            microphone = @microphone,
            vosk_model_path = @voskModelPath,
            updated_at = @updatedAt
          WHERE id = 1
        `,
      )
      .run({ ...settings, updatedAt });

    return this.find();
  }

  onModuleDestroy(): void {
    this.database.close();
  }

  private initialize(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        holyrics_host TEXT NOT NULL,
        holyrics_port INTEGER,
        language TEXT NOT NULL,
        microphone TEXT,
        vosk_model_path TEXT,
        updated_at TEXT NOT NULL
      );
    `);

    this.database
      .prepare(
        `
          INSERT OR IGNORE INTO settings (
            id,
            holyrics_host,
            holyrics_port,
            language,
            microphone,
            vosk_model_path,
            updated_at
          ) VALUES (1, '', NULL, 'pt-BR', NULL, NULL, @updatedAt)
        `,
      )
      .run({ updatedAt: new Date().toISOString() });
  }

  private mapRow(row: SettingsRow): Settings {
    return {
      holyricsHost: row.holyrics_host,
      holyricsPort: row.holyrics_port,
      language: row.language,
      microphone: row.microphone,
      voskModelPath: row.vosk_model_path,
      updatedAt: row.updated_at,
    };
  }
}
