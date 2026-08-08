import type { User } from "firebase/auth";

const rawApiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim() ?? "";

export const apiBaseUrl = rawApiBaseUrl.replace(/\/+$/, "");

export interface BackendUserProfile {
  id: string;
  firebaseUid: string;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackendVehicle {
  id: string;
  userId: string;
  nickname: string;
  make: string | null;
  model: string | null;
  modelYear: number | null;
  tankCapacityGallons: number | null;
  combinedMpg: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBackendVehicleInput {
  nickname: string;
  make?: string | null;
  model?: string | null;
  modelYear?: number | null;
  tankCapacityGallons?: number | null;
  combinedMpg?: number | null;
}

export interface UpdateBackendVehicleInput {
  nickname?: string;
  make?: string | null;
  model?: string | null;
  modelYear?: number | null;
  tankCapacityGallons?: number | null;
  combinedMpg?: number | null;
}

function getApiBaseUrl() {
  if (!apiBaseUrl) {
    throw new Error("EXPO_PUBLIC_API_URL is missing. Add it to apps/frontend/.env.");
  }

  return apiBaseUrl;
}

async function getAuthHeader(user: User) {
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function requestBackend<T>(
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
