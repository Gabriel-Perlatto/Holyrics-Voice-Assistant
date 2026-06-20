type PreferencesModule = {
  storageKey: string;
  loadFavoriteVersion(storage: StorageLike): string | null;
  saveFavoriteVersion(storage: StorageLike, versionId: string): boolean;
};

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const preferences = require('../../../../public/js/preacher-preferences.js') as PreferencesModule;

describe('preferência de versão do pregador', () => {
  const createStorage = (): StorageLike & { values: Map<string, string> } => {
    const values = new Map<string, string>();

    return {
      values,
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => {
        values.set(key, value);
      },
    };
  };

  it('salva a versão favorita no localStorage', () => {
    const storage = createStorage();

    expect(preferences.saveFavoriteVersion(storage, 'acf')).toBe(true);
    expect(storage.values.get(preferences.storageKey)).toBe('acf');
  });

  it('restaura a versão favorita salva', () => {
    const storage = createStorage();
    storage.values.set(preferences.storageKey, 'naa');

    expect(preferences.loadFavoriteVersion(storage)).toBe('naa');
  });

  it('tolera localStorage indisponível', () => {
    const storage: StorageLike = {
      getItem: () => {
        throw new Error('indisponível');
      },
      setItem: () => {
        throw new Error('indisponível');
      },
    };

    expect(preferences.loadFavoriteVersion(storage)).toBeNull();
    expect(preferences.saveFavoriteVersion(storage, 'nvi')).toBe(false);
  });
});
