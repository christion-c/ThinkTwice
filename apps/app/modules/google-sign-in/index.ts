// The native Google sign-in module (Android only). It's missing in Expo Go, which can't run custom native code.
import { requireOptionalNativeModule } from "expo";

/** Error codes the native module rejects with (see GoogleSignInModule.kt). */
export const GoogleSignInErrorCode = {
  cancelled: "ERR_GOOGLE_SIGN_IN_CANCELLED",
  noAccount: "ERR_GOOGLE_NO_ACCOUNT",
  failed: "ERR_GOOGLE_SIGN_IN_FAILED",
} as const;

export interface GoogleSignInNativeModule {
  /** Shows Google's sign-in sheet and resolves with the chosen account's Google ID token. */
  signInAsync(webClientId: string): Promise<string>;
  /** Forgets the last chosen account so the picker shows next time. */
  signOutAsync(): Promise<void>;
}

/** The native module, or null where it isn't built in (Expo Go, iOS until it's added, the web). */
export const GoogleSignIn =
  requireOptionalNativeModule<GoogleSignInNativeModule>("GoogleSignIn");
