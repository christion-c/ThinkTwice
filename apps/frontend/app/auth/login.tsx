import { router } from "expo-router";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useAppPreferences, useThemeColors } from "../../components/AppPreferences";
import PageScaffold from "../../components/PageScaffold";
import AuthSubmitButton from "../../components/auth/AuthSubmitButton";
import AuthTextField from "../../components/auth/AuthTextField";
import PreviewModeNotice from "../../components/auth/PreviewModeNotice";
import { auth, isFirebaseConfigured } from "../../lib/firebase";

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const colors = useThemeColors();
  const { colorMode } = useAppPreferences();

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
  const useBlackGoogleButton = colorMode === "light";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        setErrorMessage("Google sign-in did not return an ID token.");
        setIsGoogleSubmitting(false);
        return;
      }

      if (!auth) {
        setErrorMessage("Firebase is not configured yet. Add env values to enable Google sign-in.");
        setIsGoogleSubmitting(false);
        return;
      }

      try {
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
        router.replace("/");
      } catch {
        setErrorMessage("Unable to sign in with Google. Please try again.");
      } finally {
        setIsGoogleSubmitting(false);
      }
    };

    void signInFromGoogleResponse();
  }, [response]);

  const handleLogin = async () => {
    setErrorMessage("");

    if (!isFirebaseConfigured || !auth) {
      setErrorMessage("Firebase is not configured yet. Add env values to enable sign-in.");
      return;
    }

    if (!email.trim() || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/");
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage("");

    if (!isFirebaseConfigured || !auth) {
      setErrorMessage("Firebase is not configured yet. Add env values to enable Google sign-in.");
      return;
    }

    if (!isGoogleConfigured) {
      setErrorMessage("Google OAuth client ID is missing. Add Google client IDs to env first.");
      return;
    }

    if (Platform.OS === "web") {
      try {
        setIsGoogleSubmitting(true);
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        router.replace("/");
      } catch {
        setErrorMessage("Unable to sign in with Google. Please try again.");
      } finally {
        setIsGoogleSubmitting(false);
      }

      return;
    }

    if (!request) {
      setErrorMessage("Google sign-in is still loading. Please try again.");
      return;
    }

    try {
      setIsGoogleSubmitting(true);
      await promptAsync();
    } catch {
      setIsGoogleSubmitting(false);
      setErrorMessage("Unable to open Google sign-in. Please try again.");
    }
  };

  return (
    <PageScaffold
      title="ThinkTwice"
      subtitle="Welcome back. Sign in to continue where you left off."
    >
      <View className="gap-md rounded-lg border border-border bg-surface p-lg">
        <Text className="text-[22px] font-bold text-text">Account Login</Text>

        <PreviewModeNotice
          visible={!isFirebaseConfigured}
          message="Preview mode is active. Firebase env variables are missing, so auth is temporarily disabled."
        />

        <PreviewModeNotice
          visible={isFirebaseConfigured && !isGoogleConfigured}
          message="Google sign-in is unavailable until Google OAuth client IDs are added to env."
        />

        <AuthTextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          textContentType="emailAddress"
          placeholder="you@example.com"
          colors={colors}
        />

        <AuthTextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          placeholder="Enter password"
          colors={colors}
        />

        {errorMessage ? <Text className="text-sm text-danger">{errorMessage}</Text> : null}

        <AuthSubmitButton
          onPress={() => void handleLogin()}
          isSubmitting={isSubmitting}
          idleLabel="Sign In"
          submittingLabel="Signing in..."
        />

        <Pressable
          onPress={() => void handleGoogleSignIn()}
          disabled={isGoogleSubmitting || !isGoogleConfigured || !isFirebaseConfigured}
          className={`items-center rounded-md border py-3 active:opacity-85 disabled:opacity-85 ${
            useBlackGoogleButton ? "border-[#5F6368] bg-[#131314]" : "border-[#DADCE0] bg-white"
          }`}
        >
          <View className="flex-row items-center gap-2.5">
            <GoogleMark size={18} />
            <Text className={`text-base font-bold ${useBlackGoogleButton ? "text-white" : "text-[#3C4043]"}`}>
              {isGoogleSubmitting ? "Connecting Google..." : "Continue with Google"}
            </Text>
          </View>
        </Pressable>

        <Pressable onPress={() => router.push("/auth/forgotPassword")}>
          <Text className="text-center text-sm font-bold text-accent">Forgot password?</Text>
        </Pressable>

        <View className="flex-row items-center justify-center gap-2">
          <Text className="text-sm text-textMuted">Need an account?</Text>
          <Pressable onPress={() => router.push("/auth/register")}>
            <Text className="text-center text-sm font-bold text-accent">Sign up</Text>
          </Pressable>
        </View>
      </View>
    </PageScaffold>
  );
}

function getAuthErrorMessage(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";

  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Email or password is incorrect.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    default:
      return "Unable to sign in right now. Please try again.";
  }
}

function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23.49 12.27C23.49 11.48 23.42 10.72 23.29 10H12V14.3H18.47C18.19 15.8 17.35 17.07 16.08 17.92L19.75 20.76C21.9 18.78 23.49 15.86 23.49 12.27Z"
        fill="#4285F4"
      />
      <Path
        d="M12 24C15.24 24 17.96 22.93 19.75 20.76L16.08 17.92C15.06 18.6 13.76 19 12 19C8.88 19 6.23 16.89 5.34 14.04L1.55 16.96C3.33 21.01 7.37 24 12 24Z"
        fill="#34A853"
      />
      <Path
        d="M5.34 14.04C5.11 13.36 4.98 12.64 4.98 11.9C4.98 11.16 5.11 10.44 5.34 9.76L1.55 6.84C0.57 8.8 0 10.99 0 12.3C0 13.61 0.57 15.8 1.55 17.76L5.34 14.04Z"
        fill="#FBBC05"
      />
      <Path
        d="M12 4.6C13.93 4.6 15.66 5.26 17.02 6.56L19.84 3.74C17.95 1.98 15.24 0.6 12 0.6C7.37 0.6 3.33 3.59 1.55 7.64L5.34 10.56C6.23 7.71 8.88 4.6 12 4.6Z"
        fill="#EA4335"
      />
    </Svg>
  );
}
