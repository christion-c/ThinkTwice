import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "../../components/button";
import { Message } from "../../components/message";
import { OrDivider } from "../../components/or-divider";
import { Screen } from "../../components/screen";
import { TextField } from "../../components/text-field";
import { TextLink } from "../../components/text-link";
import { spacing } from "../../theme/tokens";
import { AuthHeader } from "./auth-header";
import { authErrorMessage } from "./auth-errors";
import { useAuth } from "./auth-provider";
import { GoogleSignInButton } from "./google-sign-in-button";
import {
  MIN_NEW_PASSWORD_LENGTH,
  validateEmail,
  validateNewPassword,
} from "./validation";

interface FieldErrors {
  email?: string | undefined;
  password?: string | undefined;
}

/** Creates a new account with an email and password. */
export function SignUpScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  // Checks the fields, then creates the account; the app sets it up and moves on by itself.
  async function handleSubmit() {
    const errors = {
      email: validateEmail(email),
      password: validateNewPassword(password),
    };
    setFieldErrors(errors);
    setFormError(undefined);
    if (errors.email !== undefined || errors.password !== undefined) {
      return;
    }
    setSubmitting(true);
    try {
      await signUp(email.trim(), password);
    } catch (error) {
      setFormError(authErrorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <AuthHeader
        title="Create your account"
        subtitle="It takes less than a minute."
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
          label={`Password (at least ${String(MIN_NEW_PASSWORD_LENGTH)} characters)`}
          value={password}
          onChangeText={setPassword}
          error={fieldErrors.password}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          autoComplete="new-password"
          textContentType="newPassword"
          onSubmitEditing={() => void handleSubmit()}
        />
        <Button
          label="Create account"
          onPress={() => void handleSubmit()}
          loading={submitting}
        />
        <OrDivider />
        <GoogleSignInButton
          onStart={() => {
            setFormError(undefined);
          }}
          onError={setFormError}
        />
        <TextLink href="/sign-in" label="Already have an account? Sign in" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
});
