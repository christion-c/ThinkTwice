import { StyleSheet, Text, View } from "react-native";

import { Button } from "../../components/button";
import { Screen } from "../../components/screen";
import { spacing, typography } from "../../theme/tokens";
import { useTheme } from "../../theme/use-theme";
import { useAuth } from "../auth/auth-provider";

/** The signed-in home screen. A placeholder until the dashboard is built. */
export function HomeScreen() {
  const { state, signOut } = useAuth();
  const { colors } = useTheme();
  const email = state.status === "ready" ? state.profile.email : "";

  return (
    <Screen>
      <View style={styles.body}>
        <Text
          role="heading"
          aria-level={1}
          style={[typography.title, { color: colors.text }]}
        >
          You&apos;re all set
        </Text>
        <Text style={[typography.body, { color: colors.textMuted }]}>
          Signed in as {email}
        </Text>
        <Button
          label="Sign out"
          variant="secondary"
          onPress={() => void signOut()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.lg },
});
