import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useAppPreferences } from "@/contexts/AppPreferencesProvider";
import PageScaffold from "@/components/layout/PageScaffold";
import AuthSubmitButton from "@/components/auth/AuthSubmitButton";
import AuthTextField from "@/components/auth/AuthTextField";
import PreviewModeNotice from "@/components/auth/PreviewModeNotice";
import { Card, CardTitle, StatusMessage } from "@/components/ui";
import { getAuthErrorMessage, getGoogleSignInErrorMessage } from "@/lib/auth-errors";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { isGoogleSignInConfigured, signInWithGoogle } from "@/lib/google-sign-in";

export default function Login() {
  const { colorMode } = useAppPreferences();

  // Web always can (Firebase's popup needs no client ID); native needs
  // EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID - see lib/google-sign-in.native.ts.
  const isGoogleConfigured = isGoogleSignInConfigured();
  const useBlackGoogleButton = colorMode === "light";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

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
      console.error("Email/password sign-in failed:", error);
      setErrorMessage(getAuthErrorMessage(error, "Unable to sign in right now. Please try again."));
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

    setIsGoogleSubmitting(true);
    try {
      // "cancelled" (the user closed Google's screen) just resets the button.
      if ((await signInWithGoogle(auth)) === "signed-in") {
        router.replace("/");
      }
    } catch (error) {
      console.error("Google sign-in failed:", error);
      const message = getGoogleSignInErrorMessage(error);
      if (message) {
        setErrorMessage(message);
      }
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <PageScaffold
      title="ThinkTwice"
      subtitle="Welcome back. Sign in to continue where you left off."
    >
      <Card surface gap="md">
        <CardTitle>Account Login</CardTitle>

        <PreviewModeNotice
          visible={!isFirebaseConfigured}
          message="Preview mode is active. Firebase env variables are missing, so auth is temporarily disabled."
        />

        <PreviewModeNotice
          visible={isFirebaseConfigured && !isGoogleConfigured}
          message="Google sign-in is unavailable in this build: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID isn't set."
        />

        <AuthTextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          textContentType="emailAddress"
          placeholder="you@example.com"
        />

        <AuthTextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          placeholder="Enter password"
        />

        <StatusMessage message={errorMessage} tone="error" />

        <AuthSubmitButton
          onPress={() => void handleLogin()}
          isSubmitting={isSubmitting}
          idleLabel="Sign In"
          submittingLabel="Signing in..."
        />

        <Pressable
          onPress={() => void handleGoogleSignIn()}
          disabled={isGoogleSubmitting || !isGoogleConfigured || !isFirebaseConfigured}
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          className={`items-center rounded-md border py-3 active:opacity-85 disabled:opacity-50 ${
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

        <Pressable onPress={() => router.push("/auth/forgot-password")}>
          <Text className="text-center text-sm font-bold text-accent">Forgot password?</Text>
        </Pressable>

        <View className="flex-row items-center justify-center gap-2">
          <Text className="text-sm text-textMuted">Need an account?</Text>
          <Pressable onPress={() => router.push("/auth/register")}>
            <Text className="text-center text-sm font-bold text-accent">Sign up</Text>
          </Pressable>
        </View>
      </Card>
    </PageScaffold>
  );
}

// Google's standard multicolor "G" (24x24 viewBox), per its sign-in
// branding guidelines.
function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}
