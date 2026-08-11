import type { ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

import { fetchFinanceInputs, upsertFinanceInputs } from "../lib/backend-api";
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
    };

    void loadPersistedInputs();
  }, [storageKey, user]);

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
  const milesPerWeek = parseMoney(milesPerWeekInput);
  const combinedMpg = parseMoney(combinedMpgInput);
  const tankCapacity = parseMoney(tankCapacityInput);
  const currentTankPercent = parseMoney(currentTankPercentInput);

  const projectedFillUpGallons = fuelGallons > 0 ? fuelGallons : tankCapacity;
  const projectedFillUpCost = projectedFillUpGallons * fuelPrice;

  const monthlyMiles = milesPerWeek * 4.345;
  const monthlyFuelGallons = combinedMpg > 0 ? monthlyMiles / combinedMpg : 0;
  const monthlyFuelBudget = monthlyFuelGallons * fuelPrice;

  const availableRangeMiles =
    combinedMpg > 0 && tankCapacity > 0
      ? (currentTankPercent / 100) * tankCapacity * combinedMpg
      : 0;

  const projectedDaysUntilFillUp =
    milesPerWeek > 0 ? (availableRangeMiles / milesPerWeek) * 7 : 0;

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
