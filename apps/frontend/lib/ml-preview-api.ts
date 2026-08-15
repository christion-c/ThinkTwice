/**
 * Client for the ML service's debug-only GET /ml-preview endpoint (see
 * services/ml/app/prediction.py's build_prediction). This is a separate,
 * unauthenticated preview flow that the frontend calls directly from the
 * browser - not to be confused with the backend-mediated POST /predict
 * path used by the main app (see backend-api.ts's prediction calls).
 *
 * Response fields match the ML service's response dict exactly (snake_case,
 * no camelCase aliasing - that's only applied to /predict). There is no
 * `food_prediction` field: the model currently only forecasts fuel cost.
 */

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

function buildCandidateUrls(miles: string, userId: string): string[] {
  const configuredBaseUrl = process.env.EXPO_PUBLIC_ML_API_URL?.trim();
  const query = `miles_driven=${encodeURIComponent(miles)}&user_id=${encodeURIComponent(userId)}`;

  // Tried in order: the configured deployment URL first, then the various
  // hostnames the ML container might be reachable at depending on where
  // the frontend itself is running (Docker Compose network, browser on the
  // host machine, or Android emulator's loopback alias).
  return [
    configuredBaseUrl ? `${configuredBaseUrl.replace(/\/+$/, "")}/ml-preview?${query}` : null,
    `http://ml:8000/ml-preview?${query}`,
    `http://127.0.0.1:8000/ml-preview?${query}`,
    `http://localhost:8000/ml-preview?${query}`,
    `http://10.0.2.2:8000/ml-preview?${query}`,
  ].filter((value): value is string => Boolean(value));
}

/** Tries each candidate host in turn, throwing with the last error if none respond. */
export async function fetchMlPreview(miles: string, userId: string): Promise<MlPreviewResponse> {
  const candidates = buildCandidateUrls(miles, userId);
  let lastError = "";

  for (const [index, url] of candidates.entries()) {
    try {
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      return (await response.json()) as MlPreviewResponse;
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : "Unknown error";
      lastError = `Preview service is unavailable right now. (${message})`;

      if (index < candidates.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
  }

  throw new Error(lastError || "Preview service is unavailable right now.");
}
