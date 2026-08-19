import { router } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import { Pressable, Text } from "react-native";

import { useThemeColors } from "../../components/AppPreferences";
import PageScaffold from "../../components/PageScaffold";
import AuthSubmitButton from "../../components/auth/AuthSubmitButton";
import AuthTextField from "../../components/auth/AuthTextField";
import PreviewModeNotice from "../../components/auth/PreviewModeNotice";
import Card from "../../components/ui/Card";
import StatusMessage from "../../components/ui/StatusMessage";
import { auth, isFirebaseConfigured } from "../../lib/firebase";

export default function ForgotPassword() {
  const colors = useThemeColors();

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
      <Card gap="md">
        <Text className="text-[22px] font-bold text-text">Request Reset Link</Text>

        <PreviewModeNotice
          visible={!isFirebaseConfigured}
          message="Preview mode is active. Firebase env variables are missing, so password reset is disabled."
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

        <StatusMessage message={errorMessage} tone="error" />
        <StatusMessage message={successMessage} tone="success" />

        <AuthSubmitButton
          onPress={() => void handleReset()}
          isSubmitting={isSubmitting}
          idleLabel="Send Reset Email"
          submittingLabel="Sending..."
        />

        <Pressable onPress={() => router.push("/auth/login")}>
          <Text className="text-center text-sm font-bold text-accent">Back to sign in</Text>
        </Pressable>
      </Card>
    </PageScaffold>
  );
}
