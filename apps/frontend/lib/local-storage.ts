import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Reads and JSON-parses a value from device storage, falling back to a
 * default when the key is missing or the stored value can't be parsed
 * (e.g. it was written by an older, incompatible app version).
 */
export async function loadJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);

    if (raw === null) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * JSON-serializes and writes a value to device storage. Failures are
 * swallowed: losing a preference write should never crash the app.
 */
export async function saveJson<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Best-effort persistence; the in-memory state is still correct.
  }
}
