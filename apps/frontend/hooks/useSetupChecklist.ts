import { useEffect } from "react";

import { useAuth } from "@/contexts/AuthProvider";
import { usePersistedUserState, type FieldValidators } from "@/hooks/usePersistedUserState";

interface ChecklistStep {
  complete: boolean;
}

interface PersistedChecklistState {
  hidden: boolean;
}

// Stable module-level references - usePersistedUserState relies on
// both never changing identity between renders (see its own comment).
const DEFAULT_CHECKLIST_STATE: PersistedChecklistState = { hidden: false };

const CHECKLIST_VALIDATORS: FieldValidators<PersistedChecklistState> = {
  hidden: (value): value is boolean => typeof value === "boolean",
};

// Owns the home screen's setup-checklist visibility and its AsyncStorage
// persistence (keyed per account): once every step is complete, or the
// user has dismissed it, that stays true across sessions instead of the
// checklist reappearing on next launch.
export function useSetupChecklist(steps: ChecklistStep[]) {
  const { user } = useAuth();
  const [{ hidden: setupChecklistHidden }, updateChecklistState] = usePersistedUserState(
    user?.uid,
    "thinktwice.setup-checklist",
    DEFAULT_CHECKLIST_STATE,
    CHECKLIST_VALIDATORS,
  );

  const completionCount = steps.filter((step) => step.complete).length;
  const shouldShowSetupChecklist = !setupChecklistHidden && completionCount < steps.length;

  useEffect(() => {
    if (completionCount === steps.length && !setupChecklistHidden) {
      updateChecklistState({ hidden: true });
    }
  }, [completionCount, setupChecklistHidden, steps.length, updateChecklistState]);

  return { shouldShowSetupChecklist, completionCount };
}
