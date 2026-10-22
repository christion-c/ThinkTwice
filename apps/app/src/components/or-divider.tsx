import { StyleSheet, Text, View } from "react-native";

import { spacing, typography } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";

/** A thin line with "or" in the middle, between two ways of doing the same thing. */
export function OrDivider() {
  const { colors } = useTheme();

  return (
    <View style={styles.row} aria-hidden>
      <View style={[styles.line, { backgroundColor: colors.border }]} />
      <Text style={[typography.caption, { color: colors.textMuted }]}>or</Text>
      <View style={[styles.line, { backgroundColor: colors.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  line: { flex: 1, height: 1 },
});
