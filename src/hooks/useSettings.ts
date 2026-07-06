import type { RestringSettings } from '../types';
import { useData } from '../context/DataContext';

export function useSettings() {
  const { settings, setSettings } = useData();

  function updateSettings(next: RestringSettings) {
    setSettings(() => next);
  }

  return { settings, updateSettings };
}
