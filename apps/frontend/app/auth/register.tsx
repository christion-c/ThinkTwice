import { router } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { useThemeColors } from "../../components/AppPreferences";
import { createAuthStyles } from "../../components/auth/auth.styles";
import PageScaffold from "../../components/PageScaffold";
import { auth, isFirebaseConfigured } from "../../lib/firebase";
import { getFirebaseErrorCode } from "../../lib/firebase-errors";

export default function Register() {
  const colors = useThemeColors();
  const styles = useMemo(() => createAuthStyles(colors), [colors]);

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

        {!isFirebaseConfigured ? (
          <Text style={styles.previewText}>
            Preview mode is active. Firebase env variables are missing, so account creation is disabled.
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
            textContentType="newPassword"
            style={styles.input}
            placeholder="Minimum 6 characters"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            textContentType="password"
            style={styles.input}
            placeholder="Re-enter password"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <Pressable
          onPress={handleRegister}
          disabled={isSubmitting}
          style={({ pressed }) => [styles.primaryButton, (pressed || isSubmitting) && styles.buttonPressed]}
        >
          <Text style={styles.primaryButtonLabel}>{isSubmitting ? "Creating account..." : "Sign Up"}</Text>
        </Pressable>

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
  switch (getFirebaseErrorCode(error)) {
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
