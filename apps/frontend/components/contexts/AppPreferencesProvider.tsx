import type { ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";

import { useAuth } from "./AuthProvider";
import { getColors, type ColorMode } from "@/components/theme";
import { DEFAULT_REMINDER_TIME, isValidReminderTime } from "@/lib/checkin-reminders";
import { usePersistedUserState, type FieldValidators } from "@/hooks/usePersistedUserState";

const PREFERENCES_STORAGE_KEY = "thinktwice.app-preferences";

interface PersistedPreferences {
  colorMode: ColorMode;
  compactCards: boolean;
  highContrast: boolean;
  remindersEnabled: boolean;
  // "HH:mm" - see lib/checkin-reminders.ts for the format contract.
  reminderTime: string;
}

// Stable module-level references - usePersistedUserState relies on
// both never changing identity between renders (see its own comment).
const DEFAULT_PREFERENCES: PersistedPreferences = {
  colorMode: "dark",
  compactCards: false,
  highContrast: false,
  remindersEnabled: true,
  reminderTime: DEFAULT_REMINDER_TIME,
};

const PREFERENCE_VALIDATORS: FieldValidators<PersistedPreferences> = {
  colorMode: (value): value is ColorMode => value === "dark" || value === "light",
  compactCards: (value): value is boolean => typeof value === "boolean",
  highContrast: (value): value is boolean => typeof value === "boolean",
  remindersEnabled: (value): value is boolean => typeof value === "boolean",
  reminderTime: isValidReminderTime,
};

type AppPreferencesValue = {
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  compactCards: boolean;
  setCompactCards: (value: boolean) => void;
  highContrast: boolean;
  setHighContrast: (value: boolean) => void;
  remindersEnabled: boolean;
  setRemindersEnabled: (value: boolean) => void;
  reminderTime: string;
  setReminderTime: (value: string) => void;
};

const AppPreferencesContext = createContext<AppPreferencesValue | undefined>(undefined);

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [preferences, updatePreferences] = usePersistedUserState(
    user?.uid,
    PREFERENCES_STORAGE_KEY,
    DEFAULT_PREFERENCES,
    PREFERENCE_VALIDATORS,
  );

  const value = useMemo(
    () => ({
      colorMode: preferences.colorMode,
      setColorMode: (mode: ColorMode) => updatePreferences({ colorMode: mode }),
      compactCards: preferences.compactCards,
      setCompactCards: (value: boolean) => updatePreferences({ compactCards: value }),
      highContrast: preferences.highContrast,
      setHighContrast: (value: boolean) => updatePreferences({ highContrast: value }),
      remindersEnabled: preferences.remindersEnabled,
      setRemindersEnabled: (value: boolean) => updatePreferences({ remindersEnabled: value }),
      reminderTime: preferences.reminderTime,
      setReminderTime: (value: string) => updatePreferences({ reminderTime: value }),
    }),
    [preferences, updatePreferences],
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
