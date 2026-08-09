import { router } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useThemeColors } from "../components/AppPreferences";
import PageScaffold from "../components/PageScaffold";
import { radii, spacing, type ThemeColors } from "../components/theme";
import { auth, isFirebaseConfigured } from "../../lib/firebase";

export default function ForgotPassword() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReset = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!isFirebaseConfigured || !auth) {
      setErrorMessage("Firebase is not configured yet. Add env values to enable password reset.");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    try {
      setIsSubmitting(true);
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMessage("Password reset email sent. Check your inbox.");
    } catch {
      setErrorMessage("Unable to send reset email right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageScaffold
      title="Reset Password"
      subtitle="Recover account access quickly and safely."
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Request Reset Link</Text>

        {!isFirebaseConfigured ? (
          <Text style={styles.previewText}>
            Preview mode is active. Firebase env variables are missing, so password reset is disabled.
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

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

        <Pressable
          onPress={handleReset}
          disabled={isSubmitting}
          style={({ pressed }) => [styles.primaryButton, (pressed || isSubmitting) && styles.buttonPressed]}
        >
          <Text style={styles.primaryButtonLabel}>{isSubmitting ? "Sending..." : "Send Reset Email"}</Text>
        </Pressable>

        <Pressable onPress={() => router.push("/auth/login")}>
          <Text style={styles.linkText}>Back to sign in</Text>
        </Pressable>
      </View>
    </PageScaffold>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.lg,
      gap: spacing.md,
    },
    cardTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "700",
    },
    formGroup: {
      gap: 6,
    },
    label: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: "600",
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.sm,
      backgroundColor: colors.surfaceSoft,
      color: colors.text,
      paddingHorizontal: spacing.sm,
      paddingVertical: 12,
      fontSize: 16,
    },
    errorText: {
      color: colors.danger,
      fontSize: 14,
    },
    previewText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    successText: {
      color: colors.success,
      fontSize: 14,
    },
    primaryButton: {
      borderRadius: radii.md,
      backgroundColor: colors.accent,
      paddingVertical: 12,
      alignItems: "center",
    },
    primaryButtonLabel: {
      color: colors.accentDeep,
      fontSize: 16,
      fontWeight: "700",
    },
    buttonPressed: {
      opacity: 0.85,
    },
    linkText: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: "700",
      textAlign: "center",
    },
  });
