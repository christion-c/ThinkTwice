import { useCallback, useEffect, useRef, useState } from "react";

import { fetchMlPreview, type MlPreviewResponse } from "../lib/ml-preview-api";

// Cloud Run cold starts can take a while to answer the first request, so
// this doesn't surface an error immediately - only if nothing has come
// back (success or failure) after a generous warm-up window.
const WARMUP_ERROR_DELAY_MS = 30000;

// Shared fetch + loading/error state for the ML debug preview endpoint.
// Used by both app/ml-preview.tsx (the preview page) and
// app/debug/ml-account.tsx (the internal per-account debug view) -
// they call the exact same backend endpoint and only differ in what
// they render. Guards against out-of-order responses (an earlier,
// slower request resolving after a newer one already succeeded) via a
// request-id ref, and won't overwrite already-loaded data with a
// stale-request error.
export function useMlPreview(userId: string, initialMiles = "120") {
  const [milesInput, setMilesInput] = useState(initialMiles);
  const [data, setData] = useState<MlPreviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasDataRef = useRef(false);

  const loadPreview = useCallback(async (miles: string) => {
    // Bump the request id so any earlier in-flight request can recognize
    // itself as stale once this one starts.
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }

    setLoading(true);
    setError("");

    // Only fires if this exact request is still the latest one and
    // nothing has loaded yet by the time the warm-up window elapses.
    errorTimeoutRef.current = setTimeout(() => {
      if (requestIdRef.current !== requestId || hasDataRef.current) {
        return;
      }

      setError("Preview service is still warming up. Please wait a moment.");
      setLoading(false);
    }, WARMUP_ERROR_DELAY_MS);

    try {
      const payload = await fetchMlPreview(miles, userId);
      // A newer request already started - ignore this now-stale response.
      if (requestIdRef.current !== requestId) {
        return;
      }

      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = null;
      }

      hasDataRef.current = true;
      setData(payload);
      setLoading(false);
      setError("");
    } catch (fetchError) {
      if (requestIdRef.current !== requestId) {
        return;
      }

      if (hasDataRef.current) {
        setLoading(false);
        setError("");
        return;
      }

      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = null;
      }

      setError(fetchError instanceof Error ? fetchError.message : "Preview service is unavailable right now.");
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadPreview(milesInput);

    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
    // Intentionally mount-only: re-fetching on every milesInput keystroke
    // would spam the service. Callers re-trigger via `reload`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    milesInput,
    setMilesInput,
    data,
    loading,
    error,
    reload: loadPreview,
  };
}
