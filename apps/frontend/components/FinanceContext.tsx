import type { ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import {
  fetchFinanceInputs,
  fetchFillUpHistory,
  type SavedFillUpHistoryEntry,
  upsertFinanceInputs,
} from "../lib/backend-api";
import { useAuth } from "./AuthProvider";
import { useVehicle } from "./VehicleContext";

const FINANCE_STORAGE_KEY = "thinktwice.finance-inputs";

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

  const storageKey = user?.uid ? `${FINANCE_STORAGE_KEY}.${user.uid}` : `${FINANCE_STORAGE_KEY}.guest`;

  useEffect(() => {
    setIncomeInput("");
    setExpenseInput("");
    setMonthlyFixedCostsInput("");
    setFuelGallonsInput("");
    setFuelPriceInput("");
    setMilesPerWeekInput("");
    setCombinedMpgInput("");
    setTankCapacityInput("");
    setCurrentTankPercentInput("");
  }, [user?.uid]);

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
      setFillUpHistory([]);
      return;
    }

    try {
      const entries = await fetchFillUpHistory(user);
      setFillUpHistory(entries);
    } catch {
      // Keep forecasting with manual inputs when history is unavailable.
      setFillUpHistory([]);
    }
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

  useEffect(() => {
    void loadFillUpHistory();
  }, [loadFillUpHistory]);

  const refresh = useCallback(async () => {
    await Promise.all([loadCloudFinanceInputs(), loadFillUpHistory()]);
  }, [loadCloudFinanceInputs, loadFillUpHistory]);

  useEffect(() => {
    if (selectedVehicle?.combinedMpg !== null && selectedVehicle?.combinedMpg !== undefined) {
      setCombinedMpgInput(String(selectedVehicle.combinedMpg));
    }

    if (
      selectedVehicle?.tankCapacityGallons !== null &&
      selectedVehicle?.tankCapacityGallons !== undefined
    ) {
      setTankCapacityInput(String(selectedVehicle.tankCapacityGallons));
    }
  }, [selectedVehicle]);

  const monthlyIncome = parseMoney(incomeInput);
  const monthlyExpenses = parseMoney(expenseInput);
  const monthlyFixedCosts = parseMoney(monthlyFixedCostsInput);
  const fuelGallons = parseMoney(fuelGallonsInput);
  const fuelPrice = parseMoney(fuelPriceInput);
  const milesSinceLastFillUp = parseMoney(milesPerWeekInput);
  const combinedMpg = parseMoney(combinedMpgInput);
  const tankCapacity = parseMoney(tankCapacityInput);
  const currentTankPercent = parseMoney(currentTankPercentInput);

  const stats = useMemo(() => computeFillUpStats(fillUpHistory), [fillUpHistory]);

  const effectiveFuelPrice =
    stats.typicalFuelPrice > 0 && fuelPrice > 0
      ? (stats.typicalFuelPrice * 0.75) + (fuelPrice * 0.25)
      : stats.typicalFuelPrice > 0
        ? stats.typicalFuelPrice
        : fuelPrice;

  const sanitizedFuelPrice = clampNumber(effectiveFuelPrice, 0, 20);

  const effectiveMpg =
    stats.typicalMpg > 0 && combinedMpg > 0
      ? (stats.typicalMpg * 0.7) + (combinedMpg * 0.3)
      : stats.typicalMpg > 0
        ? stats.typicalMpg
        : combinedMpg;

  const sanitizedMpg = clampNumber(effectiveMpg, 5, 80);

  const effectiveTankCapacity = tankCapacity > 0 ? tankCapacity : stats.typicalTankCapacity;

  const fallbackCycleDays = stats.typicalCycleDays > 0 ? stats.typicalCycleDays : 7;
  const fallbackDailyMiles = milesSinceLastFillUp > 0 ? milesSinceLastFillUp / fallbackCycleDays : 0;
  const dailyMilesEstimate = stats.dailyMiles > 0 ? stats.dailyMiles : fallbackDailyMiles;
  const sanitizedDailyMilesEstimate = clampNumber(dailyMilesEstimate, 0, 500);

  const needsFromTankLevel =
    effectiveTankCapacity > 0 && currentTankPercent >= 0 && currentTankPercent <= 100
      ? effectiveTankCapacity * Math.max(1 - (currentTankPercent / 100), 0)
      : 0;

  const projectedFillUpGallons =
    needsFromTankLevel > 0
      ? needsFromTankLevel
      : fuelGallons > 0
        ? fuelGallons
        : stats.typicalFillUpGallons > 0
          ? stats.typicalFillUpGallons
          : effectiveTankCapacity;

  const projectedFillUpCost = clampNumber(projectedFillUpGallons * sanitizedFuelPrice, 0, 5000);

  const monthlyMiles = sanitizedDailyMilesEstimate * 30.4375;
  const monthlyFuelGallons = sanitizedMpg > 0 ? monthlyMiles / sanitizedMpg : 0;
  const monthlyFuelBudget = clampNumber(monthlyFuelGallons * sanitizedFuelPrice, 0, 5000);

  const availableRangeMiles =
    sanitizedMpg > 0 && effectiveTankCapacity > 0
      ? (Math.max(Math.min(currentTankPercent, 100), 0) / 100) * effectiveTankCapacity * sanitizedMpg
      : 0;

  const projectedDaysUntilFillUp = sanitizedDailyMilesEstimate > 0 ? availableRangeMiles / sanitizedDailyMilesEstimate : 0;

  const projectedBudgetAfterEssentials =
    monthlyIncome - monthlyExpenses - monthlyFixedCosts - monthlyFuelBudget;
  const weeklySpendTarget = Math.max(
    (monthlyExpenses + monthlyFixedCosts + monthlyFuelBudget) / 4.345,
    0,
  );

  const cloudSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

function parseMoney(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function computeFillUpStats(entries: SavedFillUpHistoryEntry[]) {
  const sorted = [...entries]
    .filter((entry) => Number.isFinite(Date.parse(entry.recordedAt)))
    .sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt));

  const prices = sorted.map((entry) => positiveOrNull(entry.fuelPrice));
  const gallons = sorted.map((entry) => positiveOrNull(entry.gallons));
  const tankCapacities = sorted.map((entry) => positiveOrNull(entry.tankCapacity));

  const mpgSamples = sorted.map((entry) => {
    if (entry.milesDriven > 0 && entry.gallons > 0) {
      return entry.milesDriven / entry.gallons;
    }

    return positiveOrNull(entry.combinedMpg);
  });

  const dailyMilesSamples: number[] = [];
  const cycleDaysSamples: number[] = [];

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const current = sorted[index];
    const previous = sorted[index + 1];
    const elapsedDays =
      (Date.parse(current.recordedAt) - Date.parse(previous.recordedAt)) /
      (1000 * 60 * 60 * 24);

    if (!Number.isFinite(elapsedDays) || elapsedDays <= 0 || elapsedDays > 45) {
      continue;
    }

    cycleDaysSamples.push(elapsedDays);

    if (current.milesDriven > 0) {
      dailyMilesSamples.push(current.milesDriven / elapsedDays);
    }
  }

  return {
    typicalFuelPrice: robustRecencyAverage(prices),
    typicalFillUpGallons: robustRecencyAverage(gallons),
    typicalTankCapacity: robustRecencyAverage(tankCapacities),
    typicalMpg: robustRecencyAverage(mpgSamples),
    dailyMiles: robustRecencyAverage(dailyMilesSamples),
    typicalCycleDays: robustRecencyAverage(cycleDaysSamples),
  };
}

function robustRecencyAverage(values: Array<number | null>) {
  const finiteValues = values.filter((value): value is number =>
    typeof value === "number" && Number.isFinite(value) && value > 0,
  );

  if (finiteValues.length === 0) {
    return 0;
  }

  const recentValues = finiteValues.slice(0, 20);
  const sorted = [...recentValues].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? recentValues[0] ?? 0;
  const absDeviations = sorted.map((value) => Math.abs(value - median));
  const sortedDeviations = [...absDeviations].sort((a, b) => a - b);
  const mad = sortedDeviations[Math.floor(sortedDeviations.length / 2)] ?? 0;

  const filteredValues =
    mad > 0
      ? recentValues.filter((value) => Math.abs(value - median) <= (3 * mad))
      : recentValues;

  const stableValues = filteredValues.length > 0 ? filteredValues : recentValues;
  let weightedSum = 0;
  let totalWeight = 0;

  stableValues.forEach((value, index) => {
    const weight = Math.exp(-index / 5);
    weightedSum += value * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

function positiveOrNull(value: number) {
  return Number.isFinite(value) && value > 0 ? value : null;
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}
