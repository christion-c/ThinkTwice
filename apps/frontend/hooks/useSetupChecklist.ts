import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

import { useAuth } from "../components/AuthProvider";
import { useFinance } from "../components/FinanceContext";
import { useVehicle } from "../components/VehicleContext";

export type SetupStep = {
  label: string;
  complete: boolean;
  path: "/finance" | "/fuel";
};

/**
 * Tracks the home screen's "Get Fully Set Up" checklist: which steps are
 * done, and whether the card should still show. Once every step is
 * complete, the "hidden" state persists per-account so it stays dismissed
 * on future visits instead of popping back up.
 */
export function useSetupChecklist() {
  const { user } = useAuth();
  const { monthlyIncome, monthlyExpenses, monthlyFixedCosts, projectedFillUpCost, projectedDaysUntilFillUp } =
    useFinance();
  const { vehicles } = useVehicle();

  const [setupChecklistHidden, setSetupChecklistHidden] = useState(false);

  const setupSteps: SetupStep[] = [
    {
      label: "Budget baseline",
      complete: monthlyIncome > 0 || monthlyExpenses > 0 || monthlyFixedCosts > 0,
      path: "/finance",
    },
    {
      label: "Fuel forecast",
      complete: projectedFillUpCost > 0 || projectedDaysUntilFillUp > 0,
      path: "/fuel",
    },
    {
      label: "Vehicle profile",
      complete: vehicles.length > 0,
      path: "/fuel",
    },
  ];

  const completionCount = setupSteps.filter((step) => step.complete).length;
  const accountChecklistKey = user?.uid
    ? `thinktwice.setup-checklist.${user.uid}`
    : "thinktwice.setup-checklist.guest";
  const shouldShowChecklist = !setupChecklistHidden && completionCount < setupSteps.length;

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
    if (completionCount === setupSteps.length && !setupChecklistHidden) {
      setSetupChecklistHidden(true);
    }
  }, [completionCount, setupChecklistHidden, setupSteps.length]);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    if (setupChecklistHidden || completionCount === setupSteps.length) {
      void AsyncStorage.setItem(accountChecklistKey, JSON.stringify({ hidden: true }));
    }
  }, [accountChecklistKey, completionCount, setupChecklistHidden, setupSteps.length, user?.uid]);

  return {
    setupSteps,
    completionCount,
    shouldShowChecklist,
  };
}
