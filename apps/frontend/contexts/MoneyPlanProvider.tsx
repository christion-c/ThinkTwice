import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  createMoneyItem,
  createPaycheck,
  deleteMoneyItem,
  deletePaycheck,
  fetchMoneyPlan,
  replaceMoneyItem,
  replacePaycheck,
  savePayProfile,
  type MoneyItem,
  type MoneyItemInput,
  type Paycheck,
  type PaycheckInput,
  type PayProfile,
} from "@/lib/api/money-plan";
import { useAuth } from "./AuthProvider";

type MoneyPlanContextValue = {
  pay: PayProfile | null;
  items: MoneyItem[];
  // Logged paychecks, newest first.
  paychecks: Paycheck[];
  // True once this account's plan has loaded from the server.
  loaded: boolean;
  loadError: string | null;
  refresh: () => Promise<void>;
  // Each of these saves to the server first and only then updates what
  // the app shows, so the screen never shows a change the server
  // rejected. They throw on failure for the caller to report.
  savePay: (pay: PayProfile) => Promise<void>;
  addItem: (input: MoneyItemInput) => Promise<void>;
  updateItem: (itemId: string, input: MoneyItemInput) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  addPaycheck: (input: PaycheckInput) => Promise<void>;
  updatePaycheck: (paycheckId: string, input: PaycheckInput) => Promise<void>;
  removePaycheck: (paycheckId: string) => Promise<void>;
};

// Newest first, matching the server's order, so a check added or
// re-dated locally lands where a refetch would put it.
function newestFirst(paychecks: Paycheck[]): Paycheck[] {
  return [...paychecks].sort((a, b) => (a.paidOn < b.paidOn ? 1 : a.paidOn > b.paidOn ? -1 : 0));
}

const MoneyPlanContext = createContext<MoneyPlanContextValue | null>(null);

// Holds the signed-in user's money plan (pay profile, logged paychecks,
// bills, debts, and assets). Unlike FuelProvider, there is deliberately no local
// cache or debounced background save: the server is the single source
// of truth and every edit is an explicit, awaited save. That rules out
// the stale-cache-overwrites-server class of bug entirely, and means a
// second device always shows the same plan.
export function MoneyPlanProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [pay, setPay] = useState<PayProfile | null>(null);
  const [items, setItems] = useState<MoneyItem[]>([]);
  const [paychecks, setPaychecks] = useState<Paycheck[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Clear the previous account's plan the moment the account changes
  // (adjusted during render, same pattern as FuelProvider).
  const [lastUserId, setLastUserId] = useState(user?.uid ?? null);
  if ((user?.uid ?? null) !== lastUserId) {
    setLastUserId(user?.uid ?? null);
    setPay(null);
    setItems([]);
    setPaychecks([]);
    setLoaded(false);
    setLoadError(null);
  }

  const refresh = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      const plan = await fetchMoneyPlan(user);
      setPay(plan.pay);
      setItems(plan.items);
      // Older servers didn't send paychecks.
      setPaychecks(plan.paychecks ?? []);
      setLoaded(true);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Couldn't load your money plan.");
    }
  }, [user]);

  useEffect(() => {
    // refresh only sets state after an awaited request, never synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const requireUser = useCallback(() => {
    if (!user) {
      throw new Error("Sign in to save your money plan.");
    }
    return user;
  }, [user]);

  const savePay = useCallback(
    async (next: PayProfile) => {
      setPay(await savePayProfile(requireUser(), next));
    },
    [requireUser],
  );

  const addItem = useCallback(
    async (input: MoneyItemInput) => {
      const created = await createMoneyItem(requireUser(), input);
      setItems((current) => [...current, created]);
    },
    [requireUser],
  );

  const updateItem = useCallback(
    async (itemId: string, input: MoneyItemInput) => {
      const updated = await replaceMoneyItem(requireUser(), itemId, input);
      setItems((current) => current.map((item) => (item.id === itemId ? updated : item)));
    },
    [requireUser],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      await deleteMoneyItem(requireUser(), itemId);
      setItems((current) => current.filter((item) => item.id !== itemId));
    },
    [requireUser],
  );

  const addPaycheck = useCallback(
    async (input: PaycheckInput) => {
      const created = await createPaycheck(requireUser(), input);
      setPaychecks((current) => newestFirst([...current, created]));
    },
    [requireUser],
  );

  const updatePaycheck = useCallback(
    async (paycheckId: string, input: PaycheckInput) => {
      const updated = await replacePaycheck(requireUser(), paycheckId, input);
      setPaychecks((current) => newestFirst(current.map((check) => (check.id === paycheckId ? updated : check))));
    },
    [requireUser],
  );

  const removePaycheck = useCallback(
    async (paycheckId: string) => {
      await deletePaycheck(requireUser(), paycheckId);
      setPaychecks((current) => current.filter((check) => check.id !== paycheckId));
    },
    [requireUser],
  );

  const value = useMemo(
    () => ({
      pay,
      items,
      paychecks,
      loaded,
      loadError,
      refresh,
      savePay,
      addItem,
      updateItem,
      removeItem,
      addPaycheck,
      updatePaycheck,
      removePaycheck,
    }),
    [pay, items, paychecks, loaded, loadError, refresh, savePay, addItem, updateItem, removeItem, addPaycheck, updatePaycheck, removePaycheck],
  );

  return <MoneyPlanContext.Provider value={value}>{children}</MoneyPlanContext.Provider>;
}

export function useMoneyPlan() {
  const context = useContext(MoneyPlanContext);

  if (!context) {
    throw new Error("useMoneyPlan must be used inside MoneyPlanProvider");
  }

  return context;
}
