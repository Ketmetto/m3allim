// Platform settings (maintenance mode, sign-up rules, session length…), kept up to date live.
// When the super admin flips maintenance mode, every open browser sees it within a second.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabase.js';
import { getSettings, onSettingsChange } from '../services/settings.js';
import { DEFAULT_SETTINGS } from '../config/constants.js';

export const SettingsContext = createContext({ settings: DEFAULT_SETTINGS, loaded: true });

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(!supabase);

  useEffect(() => {
    if (!supabase) return;
    getSettings()
      .then((row) => row && setSettings(row))
      .catch(() => {}) // keep the defaults if the table isn't there yet
      .finally(() => setLoaded(true));
    return onSettingsChange(setSettings);
  }, []);

  const value = useMemo(() => ({ settings, loaded, setSettings }), [settings, loaded]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
