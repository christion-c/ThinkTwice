import type { User } from "firebase/auth";

import type {
  BudgetEntry,
  BudgetPrediction,
  CreateBudgetEntryInput,
  CreateDailyDrivingLogInput,
  CreateVehicleInput,
  DailyDrivingLog,
  FinanceInputs,
  PredictionResult,
  UpdateVehicleInput,
  UserProfile,
  Vehicle,
} from "@thinktwice/shared-types";

const rawApiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim() ?? "";

export const apiBaseUrl = rawApiBaseUrl.replace(/\/+$/, "");

// Re-exported under this file's existing names so every consumer of these
// types keeps working unchanged — @thinktwice/shared-types is now the
// single source of truth for the shapes themselves.
export type BackendUserProfile = UserProfile;
export type BackendVehicle = Vehicle;
export type CreateBackendVehicleInput = CreateVehicleInput;
export type UpdateBackendVehicleInput = UpdateVehicleInput;
export type BackendBudgetEntry = BudgetEntry;
export type CreateBackendBudgetEntryInput = CreateBudgetEntryInput;
export type { BudgetPrediction, PredictionResult, DailyDrivingLog, CreateDailyDrivingLogInput };

function getApiBaseUrl() {
  if (!apiBaseUrl) {
    throw new Error("EXPO_PUBLIC_API_URL is missing. Add it to apps/frontend/.env.");
  }

  return apiBaseUrl;
}

export async function getAuthHeader(user: User) {
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
  };
}

// Exported so other lib/*-api.ts files (e.g. ml-preview-api.ts) can make
// authenticated backend calls with the same base-URL resolution, error
// unwrapping, and 204-handling as every call in this file.
export async function requestBackend<T>(
  path: string,
  options: RequestInit,
): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, options);

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorBody = (await response.json()) as {
        error?: string;
      };

      if (errorBody.error) {
        message = errorBody.error;
      }
    } catch {
      // Ignore parse errors and use the generic message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function fetchCurrentUserProfile(
  user: User,
): Promise<BackendUserProfile> {
  const headers = await getAuthHeader(user);
  const response = await requestBackend<{ user: BackendUserProfile }>(
    "/auth/me",
    {
      method: "GET",
      headers,
    },
  );

  return response.user;
}

// Permanently deletes the signed-in user's account and every piece of
// data tied to it (vehicles, budget entries, finance inputs, fill-up
// history, daily driving logs, and their Firebase login) - see
// DELETE /users/me on the backend. Irreversible; callers must confirm
// with the user before calling this.
export async function deleteCurrentUserAccount(user: User): Promise<void> {
  const headers = await getAuthHeader(user);
  await requestBackend<void>("/users/me", {
    method: "DELETE",
    headers,
  });
}

export async function fetchVehicles(user: User): Promise<BackendVehicle[]> {
  const headers = await getAuthHeader(user);
  const response = await requestBackend<{ vehicles: BackendVehicle[] }>(
    "/vehicles",
    {
      method: "GET",
      headers,
    },
  );

  return response.vehicles;
}

export async function createVehicle(
  user: User,
  input: CreateBackendVehicleInput,
): Promise<BackendVehicle> {
  const headers = await getAuthHeader(user);
  const response = await requestBackend<{ vehicle: BackendVehicle }>(
    "/vehicles",
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  return response.vehicle;
}

export async function updateVehicle(
  user: User,
  vehicleId: string,
  input: UpdateBackendVehicleInput,
): Promise<BackendVehicle> {
  const headers = await getAuthHeader(user);
  const response = await requestBackend<{ vehicle: BackendVehicle }>(
    `/vehicles/${vehicleId}`,
    {
      method: "PATCH",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  return response.vehicle;
}

export async function fetchBudgetEntries(
  user: User,
): Promise<BackendBudgetEntry[]> {
  const headers = await getAuthHeader(user);
  const response = await requestBackend<{ entries: BackendBudgetEntry[] }>(
    "/budget-entries",
    {
      method: "GET",
      headers,
    },
  );

  return response.entries;
}

export async function createBudgetEntry(
  user: User,
  input: CreateBackendBudgetEntryInput,
): Promise<BackendBudgetEntry> {
  const headers = await getAuthHeader(user);
  const response = await requestBackend<{ entry: BackendBudgetEntry }>(
    "/budget-entries",
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  return response.entry;
}

export async function deleteBudgetEntry(
  user: User,
  entryId: string,
): Promise<void> {
  const headers = await getAuthHeader(user);
  await requestBackend<void>(`/budget-entries/${entryId}`, {
    method: "DELETE",
    headers,
  });
}

export async function fetchPredictions(user: User): Promise<PredictionResult> {
  const headers = await getAuthHeader(user);
  return requestBackend<PredictionResult>("/predictions", {
    method: "GET",
    headers,
  });
}

export type BackendFinanceInputs = FinanceInputs;

export async function fetchFinanceInputs(
  user: User,
): Promise<BackendFinanceInputs> {
  const headers = await getAuthHeader(user);
  const response = await requestBackend<{ inputs: BackendFinanceInputs }>(
    "/finance/inputs",
    { method: "GET", headers },
  );
  return response.inputs;
}

export async function upsertFinanceInputs(
  user: User,
  inputs: BackendFinanceInputs,
): Promise<BackendFinanceInputs> {
  const headers = await getAuthHeader(user);
  const response = await requestBackend<{ inputs: BackendFinanceInputs }>(
    "/finance/inputs",
    {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(inputs),
    },
  );
  return response.inputs;
}

export interface FillUpHistoryEntry {
  milesDriven: number;
  fuelPrice: number;
  combinedMpg: number;
  tankCapacity: number;
  gallons: number;
  observedCost: number;
  recordedAt?: string;
  vehicleId?: string | null;
}

export interface SavedFillUpHistoryEntry {
  id: string;
  milesDriven: number;
  fuelPrice: number;
  combinedMpg: number;
  tankCapacity: number;
  gallons: number;
  observedCost: number;
  recordedAt: string;
  vehicleId: string | null;
}

export async function fetchFillUpHistory(
  user: User,
): Promise<SavedFillUpHistoryEntry[]> {
  const headers = await getAuthHeader(user);
  const response = await requestBackend<{ entries: SavedFillUpHistoryEntry[] }>(
    "/fill-up-history",
    {
      method: "GET",
      headers,
    },
  );

  return response.entries;
}

export async function saveFillUpHistory(
  user: User,
  entry: FillUpHistoryEntry,
): Promise<void> {
  const headers = await getAuthHeader(user);
  await requestBackend<undefined>("/fill-up-history", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
}

// Reassigns a fill-up entry to a different vehicle, or unassigns it with
// vehicleId: null.
export async function reassignFillUpVehicle(
  user: User,
  entryId: string,
  vehicleId: string | null,
): Promise<SavedFillUpHistoryEntry> {
  const headers = await getAuthHeader(user);
  const response = await requestBackend<{ entry: SavedFillUpHistoryEntry }>(
    `/fill-up-history/${entryId}`,
    {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ vehicleId }),
    },
  );

  return response.entry;
}

export async function deleteFillUpHistoryEntry(
  user: User,
  entryId: string,
): Promise<void> {
  const headers = await getAuthHeader(user);
  await requestBackend<void>(`/fill-up-history/${entryId}`, {
    method: "DELETE",
    headers,
  });
}

// Deletes every fill-up entry for the signed-in user - the "start my
// data over" bulk action. Returns how many rows were removed.
export async function deleteAllFillUpHistory(user: User): Promise<number> {
  const headers = await getAuthHeader(user);
  const response = await requestBackend<{ deletedCount: number }>("/fill-up-history", {
    method: "DELETE",
    headers,
  });

  return response.deletedCount;
}

export async function fetchDailyDrivingLogs(
  user: User,
): Promise<DailyDrivingLog[]> {
  const headers = await getAuthHeader(user);
  const response = await requestBackend<{ logs: DailyDrivingLog[] }>(
    "/daily-driving-log",
    {
      method: "GET",
      headers,
    },
  );

  return response.logs;
}

export async function saveDailyDrivingLog(
  user: User,
  input: CreateDailyDrivingLogInput,
): Promise<DailyDrivingLog> {
  const headers = await getAuthHeader(user);
  const response = await requestBackend<{ log: DailyDrivingLog }>(
    "/daily-driving-log",
    {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );

  return response.log;
}

// Reassigns a daily driving log to a different vehicle, or unassigns it
// with vehicleId: null.
export async function reassignDailyDrivingLogVehicle(
  user: User,
  logId: string,
  vehicleId: string | null,
): Promise<DailyDrivingLog> {
  const headers = await getAuthHeader(user);
  const response = await requestBackend<{ log: DailyDrivingLog }>(
    `/daily-driving-log/${logId}`,
    {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ vehicleId }),
    },
  );

  return response.log;
}

export async function deleteDailyDrivingLog(user: User, logId: string): Promise<void> {
  const headers = await getAuthHeader(user);
  await requestBackend<void>(`/daily-driving-log/${logId}`, {
    method: "DELETE",
    headers,
  });
}

// Deletes every daily driving log for the signed-in user - the "start my
// data over" bulk action. Returns how many rows were removed.
export async function deleteAllDailyDrivingLogs(user: User): Promise<number> {
  const headers = await getAuthHeader(user);
  const response = await requestBackend<{ deletedCount: number }>("/daily-driving-log", {
    method: "DELETE",
    headers,
  });

  return response.deletedCount;
}
