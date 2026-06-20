(function initializePreferences(root, factory) {
  const preferences = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = preferences;
  }

  if (root) {
    root.PreacherPreferences = preferences;
  }
})(
  typeof window !== 'undefined' ? window : undefined,
  function createPreferences() {
    const storageKey = 'holyrics-voice-assistant.preacher.version';

    const loadFavoriteVersion = (storage) => {
      try {
        return storage.getItem(storageKey);
      } catch {
        return null;
      }
    };

    const saveFavoriteVersion = (storage, versionId) => {
      try {
        storage.setItem(storageKey, versionId);
        return true;
      } catch {
        return false;
      }
    };

    return {
      storageKey,
      loadFavoriteVersion,
      saveFavoriteVersion,
    };
  },
);
