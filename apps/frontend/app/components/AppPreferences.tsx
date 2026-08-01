import type { ReactNode } from "react";
import { createContext, useContext, useMemo, useState } from "react";

import { getColors, type ColorMode } from "./theme";

type AppPreferencesValue = {
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  compactCards: boolean;
  setCompactCards: (value: boolean) => void;
  showHints: boolean;
  setShowHints: (value: boolean) => void;
};

const AppPreferencesContext = createContext<AppPreferencesValue | undefined>(undefined);

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const [colorMode, setColorMode] = useState<ColorMode>("dark");
  const [compactCards, setCompactCards] = useState(false);
  const [showHints, setShowHints] = useState(true);

  const value = useMemo(
    () => ({
      colorMode,
      setColorMode,
      compactCards,
      setCompactCards,
      showHints,
      setShowHints,
    }),
    [colorMode, compactCards, showHints],
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
  const { colorMode } = useAppPreferences();
  return getColors(colorMode);
}
