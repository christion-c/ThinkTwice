// Keeps Firebase's saved sign-in in the device's encrypted keychain (iOS) or keystore (Android), never plain storage.
import * as SecureStore from "expo-secure-store";

/** Secure store values must stay under 2048 bytes, so longer values are split into chunks this size. */
export const CHUNK_SIZE = 1800;

const STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  // Readable only while the device is unlocked, and never copied to backups or other devices.
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

/**
 * Secure store keys may only contain letters, digits, ".", "-" and "_", but Firebase's keys contain ":" and "[".
 * Every other character (including "_" itself, so no two keys can collide) becomes "_" + its hex code + "_".
 */
export function toSecureStoreKey(key: string): string {
  return key.replace(
    /[^A-Za-z0-9.-]/g,
    (character) => `_${character.charCodeAt(0).toString(16)}_`,
  );
}

/** Returns the key that records how many chunks a value was split into. */
function countKey(key: string): string {
  return `${toSecureStoreKey(key)}.count`;
}

/** Returns the key of one chunk of a value. */
function chunkKey(key: string, index: number): string {
  return `${toSecureStoreKey(key)}.${String(index)}`;
}

/** Deletes every chunk of a value from `start` up to (not including) `count`. */
async function deleteChunks(
  key: string,
  start: number,
  count: number,
): Promise<void> {
  for (let index = start; index < count; index += 1) {
    await SecureStore.deleteItemAsync(chunkKey(key, index), STORE_OPTIONS);
  }
}

/** Returns how many chunks a stored value has, or 0 if nothing is stored. */
async function storedChunkCount(key: string): Promise<number> {
  const count = Number(
    await SecureStore.getItemAsync(countKey(key), STORE_OPTIONS),
  );
  return Number.isInteger(count) && count > 0 ? count : 0;
}

/** A storage adapter with the interface Firebase's getReactNativePersistence expects. */
export const secureStorage = {
  /** Returns a stored value, or null if it's missing or only partly stored. */
  async getItem(key: string): Promise<string | null> {
    const count = await storedChunkCount(key);
    if (count === 0) {
      return null;
    }
    const chunks: string[] = [];
    for (let index = 0; index < count; index += 1) {
      const chunk = await SecureStore.getItemAsync(
        chunkKey(key, index),
        STORE_OPTIONS,
      );
      if (chunk === null) {
        return null;
      }
      chunks.push(chunk);
    }
    return chunks.join("");
  },

  /** Stores a value, splitting it into chunks small enough for the secure store. */
  async setItem(key: string, value: string): Promise<void> {
    const previousCount = await storedChunkCount(key);
    const count = Math.max(1, Math.ceil(value.length / CHUNK_SIZE));
    for (let index = 0; index < count; index += 1) {
      const chunk = value.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE);
      await SecureStore.setItemAsync(
        chunkKey(key, index),
        chunk,
        STORE_OPTIONS,
      );
    }
    // The count is written last, so a value that was only partly written is never read back.
    await SecureStore.setItemAsync(countKey(key), String(count), STORE_OPTIONS);
    await deleteChunks(key, count, previousCount);
  },

  /** Deletes a value and all of its chunks. */
  async removeItem(key: string): Promise<void> {
    const count = await storedChunkCount(key);
    await SecureStore.deleteItemAsync(countKey(key), STORE_OPTIONS);
    await deleteChunks(key, 0, count);
  },
};
