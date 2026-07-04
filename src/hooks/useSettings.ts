import { useEffect, useState } from 'react';
import type { RestringSettings } from '../types';
import { settingsStorage } from '../lib/storage';
import { DEFAULT_SETTINGS } from '../lib/settings';

export function useSettings() {
  const [settings, setSettings] = useState<RestringSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(settingsStorage.get());
  }, []);

  function updateSettings(next: RestringSettings) {
    setSettings(next);
    settingsStorage.save(next);
  }

  return { settings, updateSettings };
}
