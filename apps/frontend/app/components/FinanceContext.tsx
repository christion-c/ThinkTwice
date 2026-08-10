import type { ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

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
  const { selectedVehicle } = useVehicle();
  const [incomeInput, setIncomeInput] = useState("4200");
  const [expenseInput, setExpenseInput] = useState("1700");
  const [monthlyFixedCostsInput, setMonthlyFixedCostsInput] = useState("620");
  const [fuelGallonsInput, setFuelGallonsInput] = useState("11.2");
  const [fuelPriceInput, setFuelPriceInput] = useState("4.25");
  const [milesPerWeekInput, setMilesPerWeekInput] = useState("230");
  const [combinedMpgInput, setCombinedMpgInput] = useState("28");
  const [tankCapacityInput, setTankCapacityInput] = useState("13.5");
  const [currentTankPercentInput, setCurrentTankPercentInput] = useState("55");

  useEffect(() => {
    const loadPersistedInputs = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(FINANCE_STORAGE_KEY);

        if (!storedValue) {
          return;
        }

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
      } catch {
        // Ignore malformed saved inputs and keep defaults.
      }
    };

    void loadPersistedInputs();
  }, []);

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

  useEffect(() => {
    void AsyncStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({
        incomeInput,
        expenseInput,
        monthlyFixedCostsInput,
        fuelGallonsInput,
        fuelPriceInput,
        milesPerWeekInput,
        combinedMpgInput,
        tankCapacityInput,
        currentTankPercentInput,
      }),
    );
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
