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
import { validateEmail, validatePassword } from "./validation";

interface FieldErrors {
  email?: string | undefined;
  password?: string | undefined;
}

/** Signs an existing user in with their email and password. */
export function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  // Checks the fields, then signs in; the app moves on by itself once signed in.
  async function handleSubmit() {
    const errors = {
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setFieldErrors(errors);
    setFormError(undefined);
    if (errors.email !== undefined || errors.password !== undefined) {
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (error) {
      setFormError(authErrorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <AuthHeader
        title="Welcome back"
        subtitle="Sign in to see where your money is heading."
      />
      <View style={styles.form}>
        {formError === undefined ? null : (
          <Message tone="error" text={formError} />
        )}
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          error={fieldErrors.email}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          error={fieldErrors.password}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          autoComplete="current-password"
          textContentType="password"
          onSubmitEditing={() => void handleSubmit()}
        />
        <Button
          label="Sign in"
          onPress={() => void handleSubmit()}
          loading={submitting}
        />
        <TextLink href="/forgot-password" label="Forgot your password?" />
        <TextLink href="/sign-up" label="New here? Create an account" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
});
