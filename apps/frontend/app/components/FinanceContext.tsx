import type { ReactNode } from "react";
import { createContext, useContext, useMemo, useState } from "react";

type FinanceContextValue = {
  incomeInput: string;
  setIncomeInput: (value: string) => void;
  expenseInput: string;
  setExpenseInput: (value: string) => void;
};

const FinanceContext = createContext<FinanceContextValue | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [incomeInput, setIncomeInput] = useState("1234.56");
  const [expenseInput, setExpenseInput] = useState("123.45");

  const value = useMemo(
    () => ({
      incomeInput,
      setIncomeInput,
      expenseInput,
      setExpenseInput,
    }),
    [incomeInput, expenseInput],
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
