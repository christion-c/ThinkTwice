import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { useAppPreferences, useThemeColors } from "../../components/AppPreferences";
import GoogleMark from "../../components/auth/GoogleMark";
import { createAuthStyles } from "../../components/auth/auth.styles";
import PageScaffold from "../../components/PageScaffold";
import { auth, isFirebaseConfigured } from "../../lib/firebase";
import { getFirebaseErrorCode } from "../../lib/firebase-errors";
import { useGoogleSignIn } from "../../hooks/useGoogleSignIn";

export default function Login() {
  const colors = useThemeColors();
  const { colorMode } = useAppPreferences();
  const styles = useMemo(() => createAuthStyles(colors), [colors]);
  const useBlackGoogleButton = colorMode === "light";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isGoogleConfigured, isGoogleSubmitting, handleGoogleSignIn } =
    useGoogleSignIn(setErrorMessage);

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
      setErrorMessage(getLoginErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageScaffold
      title="ThinkTwice"
      subtitle="Welcome back. Sign in to continue where you left off."
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Login</Text>

        {!isFirebaseConfigured ? (
          <Text style={styles.previewText}>
            Preview mode is active. Firebase env variables are missing, so auth is temporarily disabled.
          </Text>
        ) : null}

        {isFirebaseConfigured && !isGoogleConfigured ? (
          <Text style={styles.previewText}>
            Google sign-in is unavailable until Google OAuth client IDs are added to env.
          </Text>
        ) : null}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            textContentType="password"
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <Pressable
          onPress={handleLogin}
          disabled={isSubmitting}
          style={({ pressed }) => [styles.primaryButton, (pressed || isSubmitting) && styles.buttonPressed]}
        >
          <Text style={styles.primaryButtonLabel}>{isSubmitting ? "Signing in..." : "Sign In"}</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            void handleGoogleSignIn();
          }}
          disabled={isGoogleSubmitting || !isGoogleConfigured || !isFirebaseConfigured}
          style={({ pressed }) => [
            styles.googleButton,
            useBlackGoogleButton ? styles.googleButtonBlack : styles.googleButtonWhite,
            (pressed || isGoogleSubmitting) && styles.buttonPressed,
          ]}
        >
          <View style={styles.googleButtonContent}>
            <GoogleMark size={18} />
            <Text style={[styles.googleButtonLabel, useBlackGoogleButton ? styles.googleButtonLabelBlack : styles.googleButtonLabelWhite]}>
              {isGoogleSubmitting ? "Connecting Google..." : "Continue with Google"}
            </Text>
          </View>
        </Pressable>

        <Pressable onPress={() => router.push("/auth/forgotPassword")}>
          <Text style={styles.linkText}>Forgot password?</Text>
        </Pressable>

        <View style={styles.signupRow}>
          <Text style={styles.subtleText}>Need an account?</Text>
          <Pressable onPress={() => router.push("/auth/register")}>
            <Text style={styles.linkText}>Sign up</Text>
          </Pressable>
        </View>
      </View>
    </PageScaffold>
  );
}

function getLoginErrorMessage(error: unknown) {
  switch (getFirebaseErrorCode(error)) {
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
