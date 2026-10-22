import { FirebaseError } from "firebase/app";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "../../components/button";
import { Message } from "../../components/message";
import { Screen } from "../../components/screen";
import { TextField } from "../../components/text-field";
import { TextLink } from "../../components/text-link";
import { spacing } from "../../theme/tokens";
import { AuthHeader } from "./auth-header";
import { authErrorMessage } from "./auth-errors";
import { useAuth } from "./auth-provider";
import { validateEmail } from "./validation";

/** Never says whether an account exists for an email, so the form can't be used to discover accounts. */
const SENT_MESSAGE =
  "If there's an account for that email, we've sent a link to reset your password. Check your inbox.";

/** Sends a password reset email. */
export function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string>();
  const [result, setResult] = useState<{
    tone: "error" | "info";
    text: string;
  }>();
  const [submitting, setSubmitting] = useState(false);

  // Checks the email, then asks Firebase to send the reset link.
  async function handleSubmit() {
    const error = validateEmail(email);
    setEmailError(error);
    setResult(undefined);
    if (error !== undefined) {
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(email.trim());
      setResult({ tone: "info", text: SENT_MESSAGE });
    } catch (resetError) {
      const unknownAccount =
        resetError instanceof FirebaseError &&
        resetError.code === "auth/user-not-found";
      setResult(
        unknownAccount
          ? { tone: "info", text: SENT_MESSAGE }
          : { tone: "error", text: authErrorMessage(resetError) },
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <AuthHeader
        title="Reset your password"
        subtitle="We'll email you a link to choose a new one."
      />
      <View style={styles.form}>
        {result === undefined ? null : (
          <Message tone={result.tone} text={result.text} />
        )}
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          error={emailError}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          onSubmitEditing={() => void handleSubmit()}
        />
        <Button
          label="Send reset link"
          onPress={() => void handleSubmit()}
          loading={submitting}
        />
        <TextLink href="/sign-in" label="Back to sign in" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
});
