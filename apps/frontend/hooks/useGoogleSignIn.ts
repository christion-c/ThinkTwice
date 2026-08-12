import { router } from "expo-router";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { GoogleAuthProvider, signInWithCredential, signInWithPopup } from "firebase/auth";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

import { auth, isFirebaseConfigured } from "../lib/firebase";

WebBrowser.maybeCompleteAuthSession();

/**
 * Drives Google sign-in for the login screen: web uses a popup, native uses
 * expo-auth-session's ID-token flow via promptAsync. Reports failures
 * through onError instead of owning error state, since the login screen
 * shares one error message between this and the email/password flow.
 */
export function useGoogleSignIn(onError: (message: string) => void) {
  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const isGoogleConfigured = Boolean(
    Platform.select({
      web: googleWebClientId,
      ios: googleIosClientId,
      android: googleAndroidClientId,
      default: undefined,
    }),
  );

  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    // Placeholders prevent runtime crashes in preview mode when env vars are missing.
    webClientId: googleWebClientId ?? "preview-web-client-id",
    iosClientId: googleIosClientId ?? "preview-ios-client-id",
    androidClientId: googleAndroidClientId ?? "preview-android-client-id",
  });

  useEffect(() => {
    const signInFromGoogleResponse = async () => {
      if (response?.type !== "success") {
        return;
      }

      const idToken = response.params?.id_token;

      if (!idToken) {
        onError("Google sign-in did not return an ID token.");
        setIsGoogleSubmitting(false);
        return;
      }

      if (!auth) {
        onError("Firebase is not configured yet. Add env values to enable Google sign-in.");
        setIsGoogleSubmitting(false);
        return;
      }

      try {
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
        router.replace("/");
      } catch {
        onError("Unable to sign in with Google. Please try again.");
      } finally {
        setIsGoogleSubmitting(false);
      }
    };

    void signInFromGoogleResponse();
  }, [response]);

  const handleGoogleSignIn = async () => {
    onError("");

    if (!isFirebaseConfigured || !auth) {
      onError("Firebase is not configured yet. Add env values to enable Google sign-in.");
      return;
    }

    if (!isGoogleConfigured) {
      onError("Google OAuth client ID is missing. Add Google client IDs to env first.");
      return;
    }

    if (Platform.OS === "web") {
      try {
        setIsGoogleSubmitting(true);
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        router.replace("/");
      } catch {
        onError("Unable to sign in with Google. Please try again.");
      } finally {
        setIsGoogleSubmitting(false);
      }

      return;
    }

    if (!request) {
      onError("Google sign-in is still loading. Please try again.");
      return;
    }

    try {
      setIsGoogleSubmitting(true);
      await promptAsync();
    } catch {
      setIsGoogleSubmitting(false);
      onError("Unable to open Google sign-in. Please try again.");
    }
  };

  return {
    isGoogleConfigured,
    isGoogleSubmitting,
    handleGoogleSignIn,
  };
}
