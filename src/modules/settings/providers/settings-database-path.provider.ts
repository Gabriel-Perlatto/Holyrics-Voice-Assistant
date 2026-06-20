import { join } from 'node:path';

export const SETTINGS_DATABASE_PATH = Symbol('SETTINGS_DATABASE_PATH');

export const settingsDatabasePathProvider = {
  provide: SETTINGS_DATABASE_PATH,
  useFactory: (): string =>
    process.env.SETTINGS_DATABASE_PATH ??
    join(process.cwd(), 'data', 'settings.sqlite'),
};
