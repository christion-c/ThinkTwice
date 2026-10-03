import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

// A validator per field, so loading one malformed/missing field
// doesn't throw out the whole persisted object - just that field falls
// back to whatever's already in state (the default, on first load).
export type FieldValidators<T> = { [K in keyof T]: (value: unknown) => value is T[K] };

// Persists a plain object of primitive fields to AsyncStorage under a
// per-signed-in-user key. Shared by every provider/hook in this app
// that needs "remember this per account, reset when the account
// changes" - AppPreferencesProvider and useSetupChecklist previously
// each hand-rolled their own near-identical version of this same
// reset/load/hydration-guarded-save sequence. FuelProvider still
// hand-rolls its own instead of using this: its local persistence is
// entangled with a cloud fetch/debounced-save round trip (the cloud
// copy is the source of truth, local storage is just an offline
// cache), a genuinely different shape this hook doesn't fit.
// `validators` must be a stable reference (a module-level constant,
// not an object literal built inside the component) - it's
// deliberately left out of the load effect's dependency array below,
// since it never legitimately changes between renders and a fresh
// object identity every render would otherwise re-run that AsyncStorage
// read on every render.
export function usePersistedUserState<T extends object>(
  userId: string | undefined,
  keyPrefix: string,
  defaultValue: T,
  validators: FieldValidators<T>,
): [T, (patch: Partial<T>) => void] {
  const [state, setState] = useState<T>(defaultValue);
  const hasHydrated = useRef(false);
  const storageKey = userId ? `${keyPrefix}.${userId}` : `${keyPrefix}.guest`;

  // Reset to defaults immediately on a user change, rather than
  // briefly showing the previous account's values while the new
  // account's own storage key loads below.
  useEffect(() => {
    setState(defaultValue);
    hasHydrated.current = false;
    // defaultValue is a fresh object literal every render by
    // construction (every call site passes the same literal shape) -
    // depending on it would re-run this on every render instead of
    // only on an actual user change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(storageKey);

        if (storedValue && !cancelled) {
          const parsedValue = JSON.parse(storedValue) as Partial<Record<keyof T, unknown>>;

          setState((current) => {
            const next = { ...current };

            for (const key of Object.keys(validators) as (keyof T)[]) {
              const candidate = parsedValue[key];

              if (validators[key](candidate)) {
                next[key] = candidate;
              }
            }

            return next;
          });
        }
      } catch {
        // Ignore malformed persisted state and keep defaults.
      } finally {
        if (!cancelled) {
          hasHydrated.current = true;
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
    // validators is intentionally excluded - see the module-level
    // comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    // Guards against overwriting the just-loaded (or another
    // account's) storage with this render's still-default values,
    // before the load effect above has had a chance to run.
    if (!hasHydrated.current) {
      return;
    }

    void AsyncStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, storageKey]);

  const update = useCallback((patch: Partial<T>) => {
    setState((current) => ({ ...current, ...patch }));
  }, []);

  return [state, update];
}
