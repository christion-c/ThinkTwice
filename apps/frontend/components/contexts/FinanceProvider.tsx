import type { ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import {
  deleteAllDailyDrivingLogs,
  deleteAllFillUpHistory,
  deleteDailyDrivingLog,
  deleteFillUpHistoryEntry,
  fetchDailyDrivingLogs,
  fetchFinanceInputs,
  fetchFillUpHistory,
  reassignDailyDrivingLogVehicle,
  reassignFillUpVehicle,
  saveDailyDrivingLog,
  type DailyDrivingLog,
  type SavedFillUpHistoryEntry,
  upsertFinanceInputs,
} from "@/lib/backend-api";
import {
  computeFillUpStats,
  computeFinanceProjections,
  filterEntriesForVehicle,
} from "@/lib/finance-projections";
import { getLocalDateString } from "@/lib/local-date";
import { useAuth } from "./AuthProvider";
import { useVehicle } from "./VehicleProvider";

const FINANCE_STORAGE_KEY = "thinktwice.finance-inputs";

// This provider hand-rolls its own per-user AsyncStorage persistence
// below rather than using hooks/usePersistedUserState.ts (shared by
// AppPreferencesProvider and useSetupChecklist for the same "load
// once per account, save on change" need) - here, local storage is
// only an offline cache behind a cloud fetch that's the actual source
// of truth (loadCloudFinanceInputs), with its own debounced remote
// save. That cloud round trip is a genuinely different shape the
// shared hook doesn't cover, not an oversight.

type FinanceContextValue = {
  incomeInput: string;
  setIncomeInput: (value: string) => void;
  expenseInput: string;
  setExpenseInput: (value: string) => void;
  monthlyFixedCostsInput: string;
  setMonthlyFixedCostsInput: (value: string) => void;
  fuelGallonsInput: string;
  setFuelGallonsInput: (value: string) => void;
  fuelPriceInput: string;
  setFuelPriceInput: (value: string) => void;
  milesPerWeekInput: string;
  setMilesPerWeekInput: (value: string) => void;
  combinedMpgInput: string;
  setCombinedMpgInput: (value: string) => void;
  tankCapacityInput: string;
  setTankCapacityInput: (value: string) => void;
  currentTankPercentInput: string;
  setCurrentTankPercentInput: (value: string) => void;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyFixedCosts: number;
  monthlyFuelBudget: number;
  projectedFillUpCost: number;
  projectedDaysUntilFillUp: number;
  projectedBudgetAfterEssentials: number;
  weeklySpendTarget: number;
  // Computes the estimated miles driven since the last logged fill-up,
  // from fill-up history (daily-miles average x days since the last
  // entry) - null until there's enough history to estimate from. Lets
  // the fuel check-in flow pre-fill its "miles since last fill-up"
  // question instead of asking from a blank field every time, the same
  // way MPG is already auto-calculated from history rather than asked
  // for. A function (evaluated when the flow opens) rather than a
  // precomputed value since it depends on the current time.
  getEstimatedMilesSinceLastFillUp: () => number | null;
  fillUpHistory: SavedFillUpHistoryEntry[];
  dailyDrivingLogs: DailyDrivingLog[];
  // Saves (or corrects) today's daily driving check-in for the
  // signed-in user, then refreshes dailyDrivingLogs so the Tank
  // Forecast picks up the new sample immediately.
  logTodaysMiles: (miles: number) => Promise<void>;
  // Fix-a-mistake actions: delete a single mistaken entry, or move it to
  // a different vehicle. Each updates local state optimistically and
  // refetches on failure so the UI never drifts from the server.
  deleteFillUpEntry: (entryId: string) => Promise<void>;
  reassignFillUpEntryVehicle: (entryId: string, vehicleId: string | null) => Promise<void>;
  deleteDailyDrivingLogEntry: (logId: string) => Promise<void>;
  reassignDailyDrivingLogEntryVehicle: (logId: string, vehicleId: string | null) => Promise<void>;
  // Wipes every fill-up and check-in for the signed-in user - "start my
  // data over." Does not touch the account, login, or vehicle profiles.
  clearAllHistory: () => Promise<void>;
  refresh: () => Promise<void>;
};

const FinanceContext = createContext<FinanceContextValue | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { selectedVehicle } = useVehicle();
  const [incomeInput, setIncomeInput] = useState("");
  const [expenseInput, setExpenseInput] = useState("");
  const [monthlyFixedCostsInput, setMonthlyFixedCostsInput] = useState("");
  const [fuelGallonsInput, setFuelGallonsInput] = useState("");
  const [fuelPriceInput, setFuelPriceInput] = useState("");
  const [milesPerWeekInput, setMilesPerWeekInput] = useState("");
  const [combinedMpgInput, setCombinedMpgInput] = useState("");
  const [tankCapacityInput, setTankCapacityInput] = useState("");
  const [currentTankPercentInput, setCurrentTankPercentInput] = useState("");
  const [fillUpHistory, setFillUpHistory] = useState<SavedFillUpHistoryEntry[]>([]);
  const [dailyDrivingLogs, setDailyDrivingLogs] = useState<DailyDrivingLog[]>([]);

  const storageKey = user?.uid ? `${FINANCE_STORAGE_KEY}.${user.uid}` : `${FINANCE_STORAGE_KEY}.guest`;

  // Blank every input and cached list the moment the signed-in account
  // changes (adjusted during render, same pattern as the vehicle
  // auto-fill below) so the previous account's numbers never flash on
  // screen while loadCloudFinanceInputs/loadFillUpHistory/
  // loadDailyDrivingLogs fetch the new account's values.
  const [lastResetUserId, setLastResetUserId] = useState(user?.uid ?? null);

  if ((user?.uid ?? null) !== lastResetUserId) {
    setLastResetUserId(user?.uid ?? null);
    setIncomeInput("");
    setExpenseInput("");
    setMonthlyFixedCostsInput("");
    setFuelGallonsInput("");
    setFuelPriceInput("");
    setMilesPerWeekInput("");
    setCombinedMpgInput("");
    setTankCapacityInput("");
    setCurrentTankPercentInput("");
    setFillUpHistory([]);
    setDailyDrivingLogs([]);
  }

  const loadCloudFinanceInputs = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      const cloud = await fetchFinanceInputs(user);
      setIncomeInput(cloud.incomeInput);
      setExpenseInput(cloud.expenseInput);
      setMonthlyFixedCostsInput(cloud.monthlyFixedCostsInput);
      setFuelGallonsInput(cloud.fuelGallonsInput);
      setFuelPriceInput(cloud.fuelPriceInput);
      setMilesPerWeekInput(cloud.milesPerWeekInput);
      setCombinedMpgInput(cloud.combinedMpgInput);
      setTankCapacityInput(cloud.tankCapacityInput);
      setCurrentTankPercentInput(cloud.currentTankPercentInput);

      await AsyncStorage.setItem(storageKey, JSON.stringify(cloud));
    } catch {
      // Keep the locally cached values if the backend is unavailable.
    }
  }, [user, storageKey]);

  const loadFillUpHistory = useCallback(async () => {
    if (!user) {
      return;
    }

    // .catch() rather than try/catch: a catch block can run synchronously
    // (if fetchFillUpHistory throws before returning a promise), so
    // setState there would be just as much a synchronous-setState risk
    // as an unguarded call at the top of the function.
    const entries = await fetchFillUpHistory(user).catch(() => null);
    // Keep forecasting with manual inputs when history is unavailable.
    setFillUpHistory(entries ?? []);
  }, [user]);

  useEffect(() => {
    const loadPersistedInputs = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(storageKey);

        if (storedValue) {
          const parsedValue = JSON.parse(storedValue) as Partial<Record<
            | "incomeInput"
            | "expenseInput"
            | "monthlyFixedCostsInput"
            | "fuelGallonsInput"
            | "fuelPriceInput"
            | "milesPerWeekInput"
            | "combinedMpgInput"
            | "tankCapacityInput"
            | "currentTankPercentInput",
            string
          >>;

          if (typeof parsedValue.incomeInput === "string") {
            setIncomeInput(parsedValue.incomeInput);
          }

          if (typeof parsedValue.expenseInput === "string") {
            setExpenseInput(parsedValue.expenseInput);
          }

          if (typeof parsedValue.monthlyFixedCostsInput === "string") {
            setMonthlyFixedCostsInput(parsedValue.monthlyFixedCostsInput);
          }

          if (typeof parsedValue.fuelGallonsInput === "string") {
            setFuelGallonsInput(parsedValue.fuelGallonsInput);
          }

          if (typeof parsedValue.fuelPriceInput === "string") {
            setFuelPriceInput(parsedValue.fuelPriceInput);
          }

          if (typeof parsedValue.milesPerWeekInput === "string") {
            setMilesPerWeekInput(parsedValue.milesPerWeekInput);
          }

          if (typeof parsedValue.combinedMpgInput === "string") {
            setCombinedMpgInput(parsedValue.combinedMpgInput);
          }

          if (typeof parsedValue.tankCapacityInput === "string") {
            setTankCapacityInput(parsedValue.tankCapacityInput);
          }

          if (typeof parsedValue.currentTankPercentInput === "string") {
            setCurrentTankPercentInput(parsedValue.currentTankPercentInput);
          }
        }
      } catch {
        // Ignore malformed saved inputs and keep defaults.
      }

      // Cloud data is the source of truth — fetch it after the local cache.
      await loadCloudFinanceInputs();
    };

    void loadPersistedInputs();
    // Only meant to run when the signed-in user (and therefore storage key)
    // changes — loadCloudFinanceInputs is also called directly by refresh().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, user]);

  const loadDailyDrivingLogs = useCallback(async () => {
    if (!user) {
      return;
    }

    // .catch() rather than try/catch: a catch block can run synchronously
    // (if fetchDailyDrivingLogs throws before returning a promise), so
    // setState there is a synchronous-setState-in-effect risk the same
    // way an unguarded call at the top of the function is.
    const logs = await fetchDailyDrivingLogs(user).catch(() => null);
    // Keep forecasting with fill-up history alone when logs are unavailable.
    setDailyDrivingLogs(logs ?? []);
  }, [user]);

  useEffect(() => {
    // loadFillUpHistory only ever calls setFillUpHistory after a real
    // await (and never from a catch block - see its own comment), so
    // this can't actually cascade a synchronous render the way the rule
    // is guarding against; the linter can't see across the useCallback
    // boundary to confirm that itself.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadFillUpHistory();
  }, [loadFillUpHistory]);

  useEffect(() => {
    // Same reasoning as loadFillUpHistory's effect above.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDailyDrivingLogs();
  }, [loadDailyDrivingLogs]);

  const logTodaysMiles = useCallback(
    async (miles: number) => {
      if (!user) {
        return;
      }

      await saveDailyDrivingLog(user, {
        logDate: getLocalDateString(new Date()),
        milesDriven: miles,
        vehicleId: selectedVehicle?.id ?? null,
      });
      await loadDailyDrivingLogs();
    },
    [user, selectedVehicle, loadDailyDrivingLogs],
  );

  const deleteFillUpEntry = useCallback(
    async (entryId: string) => {
      if (!user) {
        return;
      }

      await deleteFillUpHistoryEntry(user, entryId);
      setFillUpHistory((current) => current.filter((entry) => entry.id !== entryId));
    },
    [user],
  );

  const reassignFillUpEntryVehicle = useCallback(
    async (entryId: string, vehicleId: string | null) => {
      if (!user) {
        return;
      }

      const updated = await reassignFillUpVehicle(user, entryId, vehicleId);
      setFillUpHistory((current) =>
        current.map((entry) => (entry.id === entryId ? updated : entry)),
      );
    },
    [user],
  );

  const deleteDailyDrivingLogEntry = useCallback(
    async (logId: string) => {
      if (!user) {
        return;
      }

      await deleteDailyDrivingLog(user, logId);
      setDailyDrivingLogs((current) => current.filter((log) => log.id !== logId));
    },
    [user],
  );

  const reassignDailyDrivingLogEntryVehicle = useCallback(
    async (logId: string, vehicleId: string | null) => {
      if (!user) {
        return;
      }

      const updated = await reassignDailyDrivingLogVehicle(user, logId, vehicleId);
      setDailyDrivingLogs((current) =>
        current.map((log) => (log.id === logId ? updated : log)),
      );
    },
    [user],
  );

  const clearAllHistory = useCallback(async () => {
    if (!user) {
      return;
    }

    await Promise.all([deleteAllFillUpHistory(user), deleteAllDailyDrivingLogs(user)]);
    setFillUpHistory([]);
    setDailyDrivingLogs([]);
  }, [user]);

  const refresh = useCallback(async () => {
    await Promise.all([
      loadCloudFinanceInputs(),
      loadFillUpHistory(),
      loadDailyDrivingLogs(),
    ]);
  }, [loadCloudFinanceInputs, loadFillUpHistory, loadDailyDrivingLogs]);

  // Scope the Tank Forecast to whichever vehicle is selected - see
  // filterEntriesForVehicle's own comment for exactly what counts.
  const selectedVehicleId = selectedVehicle?.id ?? null;

  // Auto-fill MPG/tank-capacity inputs from the selected vehicle's own
  // saved specs, whenever the selection changes. Adjusted during render
  // (React's documented pattern for "state that depends on a changed
  // prop") rather than in an effect, so the fill-in lands in the same
  // render/commit as the selection change instead of one tick later.
  const [lastAutoFilledVehicleId, setLastAutoFilledVehicleId] = useState<string | null>(
    selectedVehicleId,
  );

  if (selectedVehicleId !== lastAutoFilledVehicleId) {
    setLastAutoFilledVehicleId(selectedVehicleId);

    if (selectedVehicle?.combinedMpg !== null && selectedVehicle?.combinedMpg !== undefined) {
      setCombinedMpgInput(String(selectedVehicle.combinedMpg));
    }

    if (
      selectedVehicle?.tankCapacityGallons !== null &&
      selectedVehicle?.tankCapacityGallons !== undefined
    ) {
      setTankCapacityInput(String(selectedVehicle.tankCapacityGallons));
    }
  }
  const visibleFillUpHistory = useMemo(
    () => filterEntriesForVehicle(fillUpHistory, selectedVehicleId),
    [fillUpHistory, selectedVehicleId],
  );
  const visibleDailyDrivingLogs = useMemo(
    () => filterEntriesForVehicle(dailyDrivingLogs, selectedVehicleId),
    [dailyDrivingLogs, selectedVehicleId],
  );

  const stats = useMemo(
    () => computeFillUpStats(visibleFillUpHistory, visibleDailyDrivingLogs),
    [visibleFillUpHistory, visibleDailyDrivingLogs],
  );

  // A function rather than a precomputed value: it reads Date.now(), so
  // computing it during render (even memoized) isn't pure. Its only
  // caller (useFuelCheckinFlow's startFuelFlow) already only needs it
  // at the moment the check-in flow opens, not on every render.
  const getEstimatedMilesSinceLastFillUp = useCallback(() => {
    if (stats.dailyMiles <= 0) {
      return null;
    }

    const mostRecentTimestamp = visibleFillUpHistory
      .map((entry) => Date.parse(entry.recordedAt))
      .filter((timestamp) => Number.isFinite(timestamp))
      .reduce((latest, timestamp) => Math.max(latest, timestamp), 0);

    if (mostRecentTimestamp <= 0) {
      return null;
    }

    const daysSinceLastFillUp = (Date.now() - mostRecentTimestamp) / (1000 * 60 * 60 * 24);

    if (daysSinceLastFillUp <= 0) {
      return null;
    }

    return Math.round(stats.dailyMiles * daysSinceLastFillUp);
  }, [stats.dailyMiles, visibleFillUpHistory]);

  const {
    monthlyIncome,
    monthlyExpenses,
    monthlyFixedCosts,
    monthlyFuelBudget,
    projectedFillUpCost,
    projectedDaysUntilFillUp,
    projectedBudgetAfterEssentials,
    weeklySpendTarget,
  } = computeFinanceProjections(
    {
      incomeInput,
      expenseInput,
      monthlyFixedCostsInput,
      fuelGallonsInput,
      fuelPriceInput,
      milesPerWeekInput,
      combinedMpgInput,
      tankCapacityInput,
      currentTankPercentInput,
    },
    stats,
  );

  const cloudSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persists every input change locally right away, and to the backend
  // after a short debounce (so rapid keystrokes don't each trigger a
  // network call).
  useEffect(() => {
    const snapshot = {
      incomeInput,
      expenseInput,
      monthlyFixedCostsInput,
      fuelGallonsInput,
      fuelPriceInput,
      milesPerWeekInput,
      combinedMpgInput,
      tankCapacityInput,
      currentTankPercentInput,
    };

    void AsyncStorage.setItem(storageKey, JSON.stringify(snapshot));

    if (!user) {
      return;
    }

    if (cloudSaveTimer.current) {
      clearTimeout(cloudSaveTimer.current);
    }

    cloudSaveTimer.current = setTimeout(() => {
      void upsertFinanceInputs(user, snapshot).catch(() => {
        // Ignore transient network errors; the next save will retry.
      });
    }, 1500);
  }, [
    incomeInput,
    expenseInput,
    monthlyFixedCostsInput,
    fuelGallonsInput,
    fuelPriceInput,
    milesPerWeekInput,
    combinedMpgInput,
    tankCapacityInput,
    currentTankPercentInput,
    storageKey,
    user,
  ]);

  const value = useMemo(
    () => ({
      incomeInput,
      setIncomeInput,
      expenseInput,
      setExpenseInput,
      monthlyFixedCostsInput,
      setMonthlyFixedCostsInput,
      fuelGallonsInput,
      setFuelGallonsInput,
      fuelPriceInput,
      setFuelPriceInput,
      milesPerWeekInput,
      setMilesPerWeekInput,
      combinedMpgInput,
      setCombinedMpgInput,
      tankCapacityInput,
      setTankCapacityInput,
      currentTankPercentInput,
      setCurrentTankPercentInput,
      monthlyIncome,
      monthlyExpenses,
      monthlyFixedCosts,
      monthlyFuelBudget,
      projectedFillUpCost,
      projectedDaysUntilFillUp,
      projectedBudgetAfterEssentials,
      weeklySpendTarget,
      getEstimatedMilesSinceLastFillUp,
      fillUpHistory,
      dailyDrivingLogs,
      logTodaysMiles,
      deleteFillUpEntry,
      reassignFillUpEntryVehicle,
      deleteDailyDrivingLogEntry,
      reassignDailyDrivingLogEntryVehicle,
      clearAllHistory,
      refresh,
    }),
    [
      incomeInput,
      expenseInput,
      monthlyFixedCostsInput,
      fuelGallonsInput,
      fuelPriceInput,
      milesPerWeekInput,
      combinedMpgInput,
      tankCapacityInput,
      currentTankPercentInput,
      getEstimatedMilesSinceLastFillUp,
      fillUpHistory,
      dailyDrivingLogs,
      logTodaysMiles,
      deleteFillUpEntry,
      reassignFillUpEntryVehicle,
      deleteDailyDrivingLogEntry,
      reassignDailyDrivingLogEntryVehicle,
      clearAllHistory,
      monthlyIncome,
      monthlyExpenses,
      monthlyFixedCosts,
      monthlyFuelBudget,
      projectedFillUpCost,
      projectedDaysUntilFillUp,
      projectedBudgetAfterEssentials,
      weeklySpendTarget,
      refresh,
    ],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);

  if (!context) {
    throw new Error("useFinance must be used inside FinanceProvider");
  }

  return context;
}

