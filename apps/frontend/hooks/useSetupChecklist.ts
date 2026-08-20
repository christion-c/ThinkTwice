import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

import { useAuth } from "../components/AuthProvider";

interface ChecklistStep {
  complete: boolean;
}

// Owns the home screen's setup-checklist visibility and its AsyncStorage
// persistence (keyed per account): once every step is complete, or the
// user has dismissed it, that stays true across sessions instead of the
// checklist reappearing on next launch.
export function useSetupChecklist(steps: ChecklistStep[]) {
  const { user } = useAuth();
  const [setupChecklistHidden, setSetupChecklistHidden] = useState(false);

  const completionCount = steps.filter((step) => step.complete).length;
  const accountChecklistKey = user?.uid ? `thinktwice.setup-checklist.${user.uid}` : "thinktwice.setup-checklist.guest";
  const shouldShowSetupChecklist = !setupChecklistHidden && completionCount < steps.length;

  useEffect(() => {
    if (!user?.uid) {
      setSetupChecklistHidden(false);
      return;
    }

    const loadChecklistState = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(accountChecklistKey);

        if (!storedValue) {
          return;
        }

        const parsedValue = JSON.parse(storedValue) as { hidden?: boolean };

        if (typeof parsedValue.hidden === "boolean") {
          setSetupChecklistHidden(parsedValue.hidden);
        }
      } catch {
        // Ignore malformed persisted checklist state and keep defaults.
      }
    };

    void loadChecklistState();
  }, [accountChecklistKey, user?.uid]);

  useEffect(() => {
    if (completionCount === steps.length && !setupChecklistHidden) {
      setSetupChecklistHidden(true);
    }
  }, [completionCount, setupChecklistHidden, steps.length]);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    if (setupChecklistHidden || completionCount === steps.length) {
      void AsyncStorage.setItem(accountChecklistKey, JSON.stringify({ hidden: true }));
    }
  }, [accountChecklistKey, completionCount, setupChecklistHidden, steps.length, user?.uid]);

  return { shouldShowSetupChecklist, completionCount };
}
