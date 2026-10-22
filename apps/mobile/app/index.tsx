import { Image, StyleSheet, Text, View } from "react-native";

import logo from "../assets/images/logo.png";
import { Screen } from "../src/components/screen";
import { spacing, typography } from "../src/theme/tokens";
import { useTheme } from "../src/theme/use-theme";

/** The welcome screen: the logo, the app's name and its tagline. v1 features build out from here. */
export default function WelcomeScreen() {
  const { colors } = useTheme();

  return (
    <Screen>
      <View style={styles.center}>
        <Image
          source={logo}
          style={styles.logo}
          role="img"
          aria-label="ThinkTwice logo"
        />
        <Text
          role="heading"
          aria-level={1}
          style={[typography.display, { color: colors.text }]}
        >
          ThinkTwice
        </Text>
        <Text
          style={[typography.body, styles.tagline, { color: colors.textMuted }]}
        >
          Don&apos;t just track where your money went. See where it&apos;s
          taking you.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  logo: { width: 128, height: 128 },
  tagline: { textAlign: "center" },
});
