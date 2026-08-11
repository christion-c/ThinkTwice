import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

import { loadJson, saveJson } from "../lib/local-storage";
import { useVehicle } from "./VehicleContext";

const FINANCE_INPUTS_STORAGE_KEY = "thinktwice.financeInputs.v1";

interface StoredFinanceInputs {
  incomeInput: string;
  expenseInput: string;
  monthlyFixedCostsInput: string;
  fuelGallonsInput: string;
  fuelPriceInput: string;
  milesPerWeekInput: string;
  combinedMpgInput: string;
  tankCapacityInput: string;
  currentTankPercentInput: string;
}

const defaultFinanceInputs: StoredFinanceInputs = {
  incomeInput: "4200",
  expenseInput: "1700",
  monthlyFixedCostsInput: "620",
  fuelGallonsInput: "11.2",
  fuelPriceInput: "4.25",
  milesPerWeekInput: "230",
  combinedMpgInput: "28",
  tankCapacityInput: "13.5",
  currentTankPercentInput: "55",
};

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
};

const FinanceContext = createContext<FinanceContextValue | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { selectedVehicle } = useVehicle();
  const [incomeInput, setIncomeInput] = useState(defaultFinanceInputs.incomeInput);
  const [expenseInput, setExpenseInput] = useState(defaultFinanceInputs.expenseInput);
  const [monthlyFixedCostsInput, setMonthlyFixedCostsInput] = useState(
    defaultFinanceInputs.monthlyFixedCostsInput,
  );
  const [fuelGallonsInput, setFuelGallonsInput] = useState(defaultFinanceInputs.fuelGallonsInput);
  const [fuelPriceInput, setFuelPriceInput] = useState(defaultFinanceInputs.fuelPriceInput);
  const [milesPerWeekInput, setMilesPerWeekInput] = useState(defaultFinanceInputs.milesPerWeekInput);
  const [combinedMpgInput, setCombinedMpgInput] = useState(defaultFinanceInputs.combinedMpgInput);
  const [tankCapacityInput, setTankCapacityInput] = useState(defaultFinanceInputs.tankCapacityInput);
  const [currentTankPercentInput, setCurrentTankPercentInput] = useState(
    defaultFinanceInputs.currentTankPercentInput,
  );

  // Inputs load asynchronously from device storage, so writes must be
  // skipped until that load finishes or they'd overwrite it with defaults.
  const hasLoaded = useRef(false);

  useEffect(() => {
    let isMounted = true;

    void loadJson(FINANCE_INPUTS_STORAGE_KEY, defaultFinanceInputs).then((stored) => {
      if (!isMounted) {
        return;
      }

      setIncomeInput(stored.incomeInput);
      setExpenseInput(stored.expenseInput);
      setMonthlyFixedCostsInput(stored.monthlyFixedCostsInput);
      setFuelGallonsInput(stored.fuelGallonsInput);
      setFuelPriceInput(stored.fuelPriceInput);
      setMilesPerWeekInput(stored.milesPerWeekInput);
      setCombinedMpgInput(stored.combinedMpgInput);
      setTankCapacityInput(stored.tankCapacityInput);
      setCurrentTankPercentInput(stored.currentTankPercentInput);
      hasLoaded.current = true;
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoaded.current) {
      return;
    }

    void saveJson<StoredFinanceInputs>(FINANCE_INPUTS_STORAGE_KEY, {
      incomeInput,
      expenseInput,
      monthlyFixedCostsInput,
      fuelGallonsInput,
      fuelPriceInput,
      milesPerWeekInput,
      combinedMpgInput,
      tankCapacityInput,
      currentTankPercentInput,
    });
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
