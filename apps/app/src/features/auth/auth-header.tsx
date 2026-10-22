import { Image, StyleSheet, Text, View } from "react-native";

import darkLogo from "../../../assets/images/logo-dark.png";
import lightLogo from "../../../assets/images/logo.png";
import { spacing, typography } from "../../theme/tokens";
import { useTheme } from "../../theme/use-theme";

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
}

/** The logo, a screen title and an optional subtitle, shared by the sign-in screens. */
export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  const { colors, scheme } = useTheme();

  return (
    <View style={styles.header}>
      <Image
        source={scheme === "dark" ? darkLogo : lightLogo}
        style={styles.logo}
        role="img"
        aria-label="ThinkTwice logo"
      />
      <Text
        role="heading"
        aria-level={1}
        style={[typography.title, styles.centered, { color: colors.text }]}
      >
        {title}
      </Text>
      {subtitle === undefined ? null : (
        <Text
          style={[
            typography.body,
            styles.centered,
            { color: colors.textMuted },
          ]}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", gap: spacing.sm, marginBottom: spacing.xl },
  logo: { width: 96, height: 96 },
  centered: { textAlign: "center" },
});
