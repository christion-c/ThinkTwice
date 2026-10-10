// Google sign-in for Android and iOS, through the native Google Sign-In
// SDK (@react-native-google-signin/google-signin) - what Expo's guide
// recommends, since browser-redirect OAuth (expo-auth-session) relies on
// custom-scheme redirects Google restricts for Android clients. Needs a
// development or release build, not Expo Go. The web version is
// google-sign-in.ts; both export the same API.
//
// Setup outside the code: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is the *Web*
// OAuth client ID (Firebase Auth > Google provider > Web SDK
// configuration) - Google signs the ID token for it, and Firebase accepts
// tokens for its own project's web client. Android also needs each
// signing key's SHA-1 (EAS upload key and Play app signing key) added to
// the Firebase Android app, or sign-in fails with DEVELOPER_ERROR.
import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { GoogleAuthProvider, signInWithCredential, type Auth } from "firebase/auth";

export type GoogleSignInResult = "signed-in" | "cancelled";

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();

let configured = false;

function ensureConfigured() {
  if (!configured) {
    GoogleSignin.configure({ webClientId, ...(iosClientId ? { iosClientId } : {}) });
    configured = true;
  }
}

export function isGoogleSignInConfigured(): boolean {
  return Boolean(webClientId);
}

export async function signInWithGoogle(auth: Auth): Promise<GoogleSignInResult> {
  ensureConfigured();

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (isCancelledResponse(response)) {
      return "cancelled";
    }

    const idToken = response.data.idToken;
    if (!idToken) {
      throw new Error("Google sign-in did not return an ID token.");
    }

    await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
    return "signed-in";
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
      return "cancelled";
    }
    throw error;
  }
}

// Clears the native Google session too, so the next sign-in shows the
// account picker instead of silently reusing the last account.
export async function signOutOfGoogle(): Promise<void> {
  if (!webClientId) {
    return;
  }

  ensureConfigured();
  try {
    await GoogleSignin.signOut();
  } catch {
    // Not signed in with Google on this device - nothing to clear.
  }
}
