import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { Button } from "../../components/button";
import { Message } from "../../components/message";
import { Screen } from "../../components/screen";
import { spacing, typography } from "../../theme/tokens";
import { useTheme } from "../../theme/use-theme";
import { AuthHeader } from "./auth-header";
import { useAuth } from "./auth-provider";

/** Shown right after sign-in while the ThinkTwice account is created, with a way to retry if that fails. */
export function AccountSetupScreen() {
  const { state, retryAccountSetup, signOut } = useAuth();
  const { colors } = useTheme();

  return (
    <Screen>
      <AuthHeader title="Setting up your account" />
      <View style={styles.body}>
        {state.status === "setupFailed" ? (
          <>
            <Message tone="error" text={state.message} />
            <Button label="Try again" onPress={retryAccountSetup} />
            <Button
              label="Sign out"
              variant="secondary"
              onPress={() => void signOut()}
            />
          </>
        ) : (
          <View
            role="progressbar"
            aria-label="Setting up your account"
            style={styles.progress}
          >
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[typography.body, { color: colors.textMuted }]}>
              This only takes a moment.
            </Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.lg },
  progress: { alignItems: "center", gap: spacing.md },
});
