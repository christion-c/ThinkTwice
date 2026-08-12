import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "../components/AppPreferences";
import BottomNav from "../components/BottomNav";
import PageScaffold from "../components/PageScaffold";
import { radii, spacing, type ThemeColors } from "../components/theme";

/**
 * Nutrition daily check-ins are paused (not this screen's decision — see
 * team commit "undid nutrition page changes", Aug 2026). Kept as a real,
 * working route rather than commented-out dead code so /nutrition still
 * renders something honest instead of a broken page if anyone reaches it.
 */
export default function Nutrition() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <PageScaffold title="Nutrition" subtitle="This feature isn't available yet." footer={<BottomNav />}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Check back soon</Text>
        <Text style={styles.cardText}>
          Daily nutrition check-ins are paused while the team finishes this feature. Your fuel and
          finance data on the other screens aren’t affected.
        </Text>
      </View>
    </PageScaffold>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    cardTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
    },
    cardText: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 21,
    },
  });
