// Rule 13: the saved sign-in lives only in the secure store, which has strict key and size rules.
import {
  CHUNK_SIZE,
  secureStorage,
  toSecureStoreKey,
} from "../src/lib/secure-storage";

const mockKeyPattern = /^[A-Za-z0-9._-]+$/;
const mockMaxValueBytes = 2048;
const mockStore = new Map<string, string>();

// An in-memory secure store that enforces the real one's key and value-size rules.
jest.mock("expo-secure-store", () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: "WHEN_UNLOCKED_THIS_DEVICE_ONLY",
  getItemAsync: jest.fn((key: string) =>
    Promise.resolve(mockStore.get(key) ?? null),
  ),
  setItemAsync: jest.fn((key: string, value: string) => {
    if (!mockKeyPattern.test(key)) {
      return Promise.reject(new Error(`Invalid secure store key: ${key}`));
    }
    if (new TextEncoder().encode(value).length > mockMaxValueBytes) {
      return Promise.reject(new Error("Value too large for the secure store"));
    }
    mockStore.set(key, value);
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key: string) => {
    mockStore.delete(key);
    return Promise.resolve();
  }),
}));

const FIREBASE_KEY = "firebase:authUser:AIzaExample:[DEFAULT]";

beforeEach(() => {
  mockStore.clear();
});

describe("toSecureStoreKey", () => {
  it("turns Firebase's keys into valid secure store keys", () => {
    expect(toSecureStoreKey(FIREBASE_KEY)).toMatch(mockKeyPattern);
  });

  it("never maps two different keys to the same secure store key", () => {
    expect(toSecureStoreKey("a:b")).not.toBe(toSecureStoreKey("a_3a_b"));
    expect(toSecureStoreKey("a_b")).not.toBe(toSecureStoreKey("a-b"));
  });
});

describe("secureStorage", () => {
  it("round-trips a short value", async () => {
    await secureStorage.setItem(FIREBASE_KEY, "short");
    expect(await secureStorage.getItem(FIREBASE_KEY)).toBe("short");
  });

  it("round-trips a value far larger than the secure store allows in one entry", async () => {
    const large = "x".repeat(CHUNK_SIZE * 3 + 17);
    await secureStorage.setItem(FIREBASE_KEY, large);
    expect(await secureStorage.getItem(FIREBASE_KEY)).toBe(large);
  });

  it("round-trips an empty value", async () => {
    await secureStorage.setItem(FIREBASE_KEY, "");
    expect(await secureStorage.getItem(FIREBASE_KEY)).toBe("");
  });

  it("returns null for a value that was never stored", async () => {
    expect(await secureStorage.getItem(FIREBASE_KEY)).toBeNull();
  });

  it("removes every chunk of a value", async () => {
    await secureStorage.setItem(FIREBASE_KEY, "x".repeat(CHUNK_SIZE * 2 + 1));
    await secureStorage.removeItem(FIREBASE_KEY);
    expect(await secureStorage.getItem(FIREBASE_KEY)).toBeNull();
    expect(mockStore.size).toBe(0);
  });

  it("deletes leftover chunks when a value shrinks", async () => {
    await secureStorage.setItem(FIREBASE_KEY, "x".repeat(CHUNK_SIZE * 3));
    await secureStorage.setItem(FIREBASE_KEY, "small");
    expect(await secureStorage.getItem(FIREBASE_KEY)).toBe("small");
    expect(mockStore.size).toBe(2);
  });

  it("never returns a value that's only partly stored", async () => {
    await secureStorage.setItem(FIREBASE_KEY, "x".repeat(CHUNK_SIZE * 2));
    mockStore.delete(`${toSecureStoreKey(FIREBASE_KEY)}.1`);
    expect(await secureStorage.getItem(FIREBASE_KEY)).toBeNull();
  });
});
