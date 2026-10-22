// @firebase/auth lists its browser types before its React Native types, so TypeScript never sees
// getReactNativePersistence, even though Metro loads the React Native build (where it exists) on iOS and Android.
// This mirrors its declaration in @firebase/auth/dist/rn/src/platform_react_native/persistence/react_native.d.ts.
import type { Persistence } from "@firebase/auth";

declare module "@firebase/auth" {
  /** The storage interface Firebase needs to save the sign-in (matches AsyncStorage's). */
  interface ReactNativeAsyncStorage {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
  }

  /** Returns a persistence that saves the sign-in in the given storage. */
  export function getReactNativePersistence(
    storage: ReactNativeAsyncStorage,
  ): Persistence;
}
