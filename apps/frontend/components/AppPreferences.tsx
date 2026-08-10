import type { ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "./AuthProvider";
import { getColors, type ColorMode } from "./theme";

const PREFERENCES_STORAGE_KEY = "thinktwice.app-preferences";

type AppPreferencesValue = {
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  compactCards: boolean;
  setCompactCards: (value: boolean) => void;
  highContrast: boolean;
  setHighContrast: (value: boolean) => void;
  remindersEnabled: boolean;
  setRemindersEnabled: (value: boolean) => void;
  budgetAlertsEnabled: boolean;
  setBudgetAlertsEnabled: (value: boolean) => void;
};

const AppPreferencesContext = createContext<AppPreferencesValue | undefined>(undefined);

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [colorMode, setColorMode] = useState<ColorMode>("dark");
  const [compactCards, setCompactCards] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [budgetAlertsEnabled, setBudgetAlertsEnabled] = useState(true);
  const hasHydrated = useRef(false);
  const storageKey = user?.uid ? `${PREFERENCES_STORAGE_KEY}.${user.uid}` : `${PREFERENCES_STORAGE_KEY}.guest`;

  useEffect(() => {
    setColorMode("dark");
    setCompactCards(false);
    setHighContrast(false);
    setRemindersEnabled(true);
    setBudgetAlertsEnabled(true);
    hasHydrated.current = false;
  }, [user?.uid]);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(storageKey);

        if (!storedValue) {
          return;
        }

        const parsedValue = JSON.parse(storedValue) as Partial<{
          colorMode: ColorMode;
          compactCards: boolean;
          highContrast: boolean;
          remindersEnabled: boolean;
          budgetAlertsEnabled: boolean;
        }>;

        if (parsedValue.colorMode === "dark" || parsedValue.colorMode === "light") {
          setColorMode(parsedValue.colorMode);
        }

        if (typeof parsedValue.compactCards === "boolean") {
          setCompactCards(parsedValue.compactCards);
        }

        if (typeof parsedValue.highContrast === "boolean") {
          setHighContrast(parsedValue.highContrast);
        }

        if (typeof parsedValue.remindersEnabled === "boolean") {
          setRemindersEnabled(parsedValue.remindersEnabled);
        }

        if (typeof parsedValue.budgetAlertsEnabled === "boolean") {
          setBudgetAlertsEnabled(parsedValue.budgetAlertsEnabled);
        }
      } catch {
        // Ignore malformed persisted preferences and keep defaults.
      } finally {
        hasHydrated.current = true;
      }
    };

    void loadPreferences();
  }, [storageKey]);

  useEffect(() => {
    if (!hasHydrated.current) {
      return;
    }

    void AsyncStorage.setItem(
      storageKey,
      JSON.stringify({
        colorMode,
        compactCards,
        highContrast,
        remindersEnabled,
        budgetAlertsEnabled,
      }),
    );
  }, [colorMode, compactCards, highContrast, remindersEnabled, budgetAlertsEnabled, storageKey]);

  const value = useMemo(
    () => ({
      colorMode,
      setColorMode,
      compactCards,
      setCompactCards,
      highContrast,
      setHighContrast,
      remindersEnabled,
      setRemindersEnabled,
      budgetAlertsEnabled,
      setBudgetAlertsEnabled,
    }),
    [
      colorMode,
      compactCards,
      highContrast,
      remindersEnabled,
      budgetAlertsEnabled,
    ],
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
