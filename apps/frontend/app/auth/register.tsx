import { router } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useThemeColors } from "../../components/AppPreferences";
import PageScaffold from "../../components/PageScaffold";
import AuthSubmitButton from "../../components/auth/AuthSubmitButton";
import AuthTextField from "../../components/auth/AuthTextField";
import PreviewModeNotice from "../../components/auth/PreviewModeNotice";
import { createAuthFormStyles } from "../../components/auth/auth-form-styles";
import { auth, isFirebaseConfigured } from "../../lib/firebase";

export default function Register() {
  const colors = useThemeColors();
  const styles = useMemo(() => createAuthFormStyles(colors), [colors]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    setErrorMessage("");

    if (!isFirebaseConfigured || !auth) {
      setErrorMessage("Firebase is not configured yet. Add env values to enable sign-up.");
      return;
    }

    if (!email.trim() || !password || !confirmPassword) {
      setErrorMessage("Please complete all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/");
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageScaffold
      title="Sign Up"
      subtitle="Create your account and personalize your experience."
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create Account</Text>

        <PreviewModeNotice
          visible={!isFirebaseConfigured}
          message="Preview mode is active. Firebase env variables are missing, so account creation is disabled."
          styles={styles}
        />

        <AuthTextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          textContentType="emailAddress"
          placeholder="you@example.com"
          colors={colors}
          styles={styles}
        />

        <AuthTextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="newPassword"
          placeholder="Minimum 6 characters"
          colors={colors}
          styles={styles}
        />

        <AuthTextField
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          textContentType="password"
          placeholder="Re-enter password"
          colors={colors}
          styles={styles}
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <AuthSubmitButton
          onPress={() => void handleRegister()}
          isSubmitting={isSubmitting}
          idleLabel="Sign Up"
          submittingLabel="Creating account..."
          styles={styles}
        />

        <View style={styles.signupRow}>
          <Text style={styles.subtleText}>Already have an account?</Text>
          <Pressable onPress={() => router.push("/auth/login")}>
            <Text style={styles.linkText}>Sign in</Text>
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
    case "auth/email-already-in-use":
      return "That email is already in use.";
    case "auth/weak-password":
      return "Password is too weak. Use a stronger one.";
    default:
      return "Unable to create account right now. Please try again.";
  }
}
