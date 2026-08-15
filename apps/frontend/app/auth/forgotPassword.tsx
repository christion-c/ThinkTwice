import { router } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useThemeColors } from "../../components/AppPreferences";
import PageScaffold from "../../components/PageScaffold";
import AuthSubmitButton from "../../components/auth/AuthSubmitButton";
import AuthTextField from "../../components/auth/AuthTextField";
import PreviewModeNotice from "../../components/auth/PreviewModeNotice";
import { createAuthFormStyles } from "../../components/auth/auth-form-styles";
import { auth, isFirebaseConfigured } from "../../lib/firebase";

export default function ForgotPassword() {
  const colors = useThemeColors();
  const styles = useMemo(() => createAuthFormStyles(colors), [colors]);

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

        <PreviewModeNotice
          visible={!isFirebaseConfigured}
          message="Preview mode is active. Firebase env variables are missing, so password reset is disabled."
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

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

        <AuthSubmitButton
          onPress={() => void handleReset()}
          isSubmitting={isSubmitting}
          idleLabel="Send Reset Email"
          submittingLabel="Sending..."
          styles={styles}
        />

        <Pressable onPress={() => router.push("/auth/login")}>
          <Text style={styles.linkText}>Back to sign in</Text>
        </Pressable>
      </View>
    </PageScaffold>
  );
}
