import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "./AuthProvider";
import {
  createBudgetEntry,
  deleteBudgetEntry,
  fetchBudgetEntries,
  fetchPredictions,
  type BackendBudgetEntry,
  type CreateBackendBudgetEntryInput,
  type PredictionResult,
} from "@/lib/backend-api";

// No screen currently calls useBudget() - app/nutrition.tsx (its
// intended consumer) is a stub because daily nutrition check-ins are
// paused (see that file's own comment). This provider used to stay
// mounted in app/_layout.tsx anyway, firing fetchBudgetEntries/
// fetchPredictions's refresh() effect for every signed-in session with
// nothing reading the result - a real, invisible network cost for a
// paused feature. Unmounted from the tree for that reason; this file
// is kept (not deleted) since pausing a feature isn't the same as
// deciding it's gone for good, and re-wrapping <AppStack> in
// <BudgetProvider> in _layout.tsx is a one-line change to redo when
// nutrition comes back.

type BudgetContextValue = {
  entries: BackendBudgetEntry[];
  prediction: PredictionResult | null;
  loading: boolean;
  syncing: boolean;
  errorMessage: string;
  refresh: () => Promise<void>;
  logEntry: (input: CreateBackendBudgetEntryInput) => Promise<BackendBudgetEntry>;
  removeEntry: (entryId: string) => Promise<void>;
};

const BudgetContext = createContext<BudgetContextValue | undefined>(undefined);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const { user, initializing } = useAuth();

  const [entries, setEntries] = useState<BackendBudgetEntry[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Blank out the previous account's entries the moment the signed-in
  // account changes (adjusted during render - see FinanceProvider's
  // identical pattern for why), rather than inside refresh itself, so
  // refresh never needs to set state before its own fetch actually
  // starts.
  const [lastResetUserId, setLastResetUserId] = useState(user?.uid ?? null);

  if ((user?.uid ?? null) !== lastResetUserId) {
    setLastResetUserId(user?.uid ?? null);
    setEntries([]);
    setPrediction(null);
    setErrorMessage("");
  }

  const refresh = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const [nextEntries, nextPrediction] = await Promise.all([
        fetchBudgetEntries(user),
        fetchPredictions(user),
      ]);

      setEntries(nextEntries);
      setPrediction(nextPrediction);
    } catch (error) {
      console.error("Failed to load budget entries/predictions:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load your check-ins from the backend.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (initializing) {
      return;
    }

    // refresh sets loading/error state synchronously before its fetch
    // resolves (setLoading(true)/setErrorMessage("") up front, plus its
    // catch/finally) - the linter can't see across the useCallback
    // boundary to confirm that's the only remaining synchronous state,
    // now that the account-reset branch has moved to render time above.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [initializing, refresh]);

  const logEntry = useCallback(
    async (input: CreateBackendBudgetEntryInput) => {
      if (!user) {
        throw new Error("Authentication required");
      }

      try {
        setSyncing(true);
        setErrorMessage("");

        const entry = await createBudgetEntry(user, input);

        setEntries((currentEntries) => [entry, ...currentEntries]);

        // A fresh entry can change the forecast (or unlock it for the
        // first time), so pull the latest prediction too.
        try {
          setPrediction(await fetchPredictions(user));
        } catch {
          // The entry itself saved successfully; a stale prediction isn't
          // worth surfacing as an error.
        }

        return entry;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to save this check-in.";
        setErrorMessage(message);
        throw error;
      } finally {
        setSyncing(false);
      }
    },
    [user],
  );

  const removeEntry = useCallback(
    async (entryId: string) => {
      if (!user) {
        throw new Error("Authentication required");
      }

      try {
        setSyncing(true);
        setErrorMessage("");

        await deleteBudgetEntry(user, entryId);

        setEntries((currentEntries) =>
          currentEntries.filter((entry) => entry.id !== entryId),
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to delete this check-in.";
        setErrorMessage(message);
        throw error;
      } finally {
        setSyncing(false);
      }
    },
    [user],
  );

  const value = useMemo(
    () => ({
      entries,
      prediction,
      loading,
      syncing,
      errorMessage,
      refresh,
      logEntry,
      removeEntry,
    }),
    [entries, prediction, loading, syncing, errorMessage, refresh, logEntry, removeEntry],
  );

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudget() {
  const context = useContext(BudgetContext);

  if (!context) {
    throw new Error("useBudget must be used inside BudgetProvider");
  }

  return context;
}
