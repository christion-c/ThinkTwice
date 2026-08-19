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
  createVehicle,
  fetchCurrentUserProfile,
  fetchVehicles,
  type BackendUserProfile,
  type BackendVehicle,
  updateVehicle,
} from "../lib/backend-api";

interface SyncVehicleInput {
  nickname: string;
  make: string;
  model: string;
  modelYear: number | null;
  tankCapacityGallons: number | null;
  combinedMpg: number | null;
}

type VehicleContextValue = {
  backendUser: BackendUserProfile | null;
  vehicles: BackendVehicle[];
  selectedVehicle: BackendVehicle | null;
  selectedVehicleId: string | null;
  loading: boolean;
  syncing: boolean;
  errorMessage: string;
  refreshVehicles: () => Promise<void>;
  selectVehicle: (vehicleId: string) => void;
  syncVehicle: (input: SyncVehicleInput) => Promise<BackendVehicle>;
};

const VehicleContext = createContext<VehicleContextValue | undefined>(
  undefined,
);

export function VehicleProvider({ children }: { children: ReactNode }) {
  const { user, initializing } = useAuth();

  const [backendUser, setBackendUser] = useState<BackendUserProfile | null>(
    null,
  );
  const [vehicles, setVehicles] = useState<BackendVehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const refreshVehicles = useCallback(async () => {
    if (!user) {
      setBackendUser(null);
      setVehicles([]);
      setSelectedVehicleId(null);
      setErrorMessage("");
      return;
    }

    // Deliberately doesn't clear backendUser/vehicles/selectedVehicleId
    // before fetching: useRefetchOnFocus calls this every time a screen
    // regains focus, and clearing first would (a) flash the vehicle
    // selector empty on every tab switch, and (b) permanently reset
    // selectedVehicleId below back to null before the fetch resolves,
    // making the "keep the current selection if it still exists" check
    // always fail. Leaving the previous state in place until the fetch
    // resolves also means a transient network failure below just shows
    // an error over the last-known data instead of wiping it blank.
    setErrorMessage("");

    try {
      setLoading(true);

      const [profile, nextVehicles] = await Promise.all([
        fetchCurrentUserProfile(user),
        fetchVehicles(user),
      ]);

      setBackendUser(profile);
      setVehicles(nextVehicles);

      setSelectedVehicleId((currentId) => {
        if (currentId && nextVehicles.some((vehicle) => vehicle.id === currentId)) {
          return currentId;
        }

        return nextVehicles[0]?.id ?? null;
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to sync vehicles from backend.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (initializing) {
      return;
    }

    void refreshVehicles();
  }, [initializing, refreshVehicles]);

  const selectVehicle = useCallback((vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
  }, []);

  const selectedVehicle = useMemo(
    () =>
      selectedVehicleId === null
        ? null
        : vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null,
    [selectedVehicleId, vehicles],
  );

  const syncVehicle = useCallback(
    async (input: SyncVehicleInput) => {
      if (!user) {
        throw new Error("Authentication required");
      }

      const nickname = input.nickname.trim();

      if (!nickname) {
        throw new Error("Vehicle nickname is required.");
      }

      const make = normalizeTextField(input.make);
      const model = normalizeTextField(input.model);

      const payload = {
        nickname,
        make,
        model,
        modelYear: input.modelYear,
        tankCapacityGallons: input.tankCapacityGallons,
        combinedMpg: input.combinedMpg,
      };

      try {
        setSyncing(true);
        setErrorMessage("");

        const currentVehicle = selectedVehicle ?? null;

        const syncedVehicle = currentVehicle
          ? await updateVehicle(user, currentVehicle.id, payload)
          : await createVehicle(user, payload);

        setVehicles((currentVehicles) => {
          const existingIndex = currentVehicles.findIndex(
            (vehicle) => vehicle.id === syncedVehicle.id,
          );

          if (existingIndex === -1) {
            return [syncedVehicle, ...currentVehicles];
          }

          const nextVehicles = [...currentVehicles];
          nextVehicles[existingIndex] = syncedVehicle;
          return nextVehicles;
        });

        setSelectedVehicleId(syncedVehicle.id);

        return syncedVehicle;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to sync vehicle.";
        setErrorMessage(message);
        throw error;
      } finally {
        setSyncing(false);
      }
    },
    [selectedVehicle, user],
  );

  const value = useMemo(
    () => ({
      backendUser,
      vehicles,
      selectedVehicle,
      selectedVehicleId,
      loading,
      syncing,
      errorMessage,
      refreshVehicles,
      selectVehicle,
      syncVehicle,
    }),
    [
      backendUser,
      vehicles,
      selectedVehicle,
      selectedVehicleId,
      loading,
      syncing,
      errorMessage,
      refreshVehicles,
      selectVehicle,
      syncVehicle,
    ],
  );

  return (
    <VehicleContext.Provider value={value}>{children}</VehicleContext.Provider>
  );
}

export function useVehicle() {
  const context = useContext(VehicleContext);

  if (!context) {
    throw new Error("useVehicle must be used inside VehicleProvider");
  }

  return context;
}

function normalizeTextField(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}
