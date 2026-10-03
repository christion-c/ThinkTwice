import type { User } from "firebase/auth";

import { getAuthHeader, requestBackend } from "./backend";

// Client for the backend's authenticated GET /predictions/preview route,
// which proxies to the ML service's debug-only /ml-preview endpoint. This
// used to call the ML service directly with a plain ?user_id= query
// param and no auth at all, which meant anyone who guessed another
// user's Firebase uid could read that user's fill-up history and
// prediction. Routing through the backend means the caller's identity
// is verified via their own Firebase ID token, and the backend is the
// only thing that ever holds the ML service's internal token.
//
// Response fields match the ML service's response dict exactly
// (snake_case, no camelCase aliasing - that's only applied to
// /predict). There is no `food_prediction` field: the model currently
// only forecasts fuel cost.
export interface MlPreviewResponse {
  rows: number;
  history_count: number;
  next_week: {
    miles_driven: number;
  };
  fuel_prediction: number;
  total_prediction: number;
  feedback: string;
  explanation: string;
  sample_rows: {
    date: string;
    fuel_cost: number;
    miles_driven: number;
  }[];
}

export async function fetchMlPreview(user: User, miles: string): Promise<MlPreviewResponse> {
  const milesDriven = Number.parseInt(miles, 10);
  const query = new URLSearchParams({
    miles_driven: String(Number.isFinite(milesDriven) ? milesDriven : 120),
  });

  return requestBackend<MlPreviewResponse>(`/predictions/preview?${query}`, {
    headers: await getAuthHeader(user),
  });
}
