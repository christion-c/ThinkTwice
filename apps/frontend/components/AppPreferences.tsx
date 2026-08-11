import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

import { loadJson, saveJson } from "../lib/local-storage";
import { getColors, type ColorMode } from "./theme";

const PREFERENCES_STORAGE_KEY = "thinktwice.preferences.v1";

interface StoredPreferences {
  colorMode: ColorMode;
  compactCards: boolean;
  showHints: boolean;
  highContrast: boolean;
}

const defaultPreferences: StoredPreferences = {
  colorMode: "dark",
  compactCards: false,
  showHints: true,
  highContrast: false,
};

type AppPreferencesValue = {
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  compactCards: boolean;
  setCompactCards: (value: boolean) => void;
  showHints: boolean;
  setShowHints: (value: boolean) => void;
  highContrast: boolean;
  setHighContrast: (value: boolean) => void;
};

const AppPreferencesContext = createContext<AppPreferencesValue | undefined>(undefined);

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const [colorMode, setColorMode] = useState<ColorMode>(defaultPreferences.colorMode);
  const [compactCards, setCompactCards] = useState(defaultPreferences.compactCards);
  const [showHints, setShowHints] = useState(defaultPreferences.showHints);
  const [highContrast, setHighContrast] = useState(defaultPreferences.highContrast);

  // Preferences load asynchronously from device storage, so writes must be
  // skipped until that load finishes or they'd overwrite it with defaults.
  const hasLoaded = useRef(false);

  useEffect(() => {
    let isMounted = true;

    void loadJson(PREFERENCES_STORAGE_KEY, defaultPreferences).then((stored) => {
      if (!isMounted) {
        return;
      }

      setColorMode(stored.colorMode);
      setCompactCards(stored.compactCards);
      setShowHints(stored.showHints);
      setHighContrast(stored.highContrast);
      hasLoaded.current = true;
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoaded.current) {
      return;
    }

    void saveJson<StoredPreferences>(PREFERENCES_STORAGE_KEY, {
      colorMode,
      compactCards,
      showHints,
      highContrast,
    });
  }, [colorMode, compactCards, showHints, highContrast]);

  const value = useMemo(
    () => ({
      colorMode,
      setColorMode,
      compactCards,
      setCompactCards,
      showHints,
      setShowHints,
      highContrast,
      setHighContrast,
    }),
    [colorMode, compactCards, showHints, highContrast],
  );

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
}

export function useAppPreferences() {
  const context = useContext(AppPreferencesContext);

  if (!context) {
    throw new Error("useAppPreferences must be used inside AppPreferencesProvider");
  }

  return context;
}

export function useThemeColors() {
  const { colorMode, highContrast } = useAppPreferences();
  return getColors(colorMode, highContrast);
}
