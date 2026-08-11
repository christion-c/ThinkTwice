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
} from "../lib/backend-api";

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

  const refresh = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setPrediction(null);
      setErrorMessage("");
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
