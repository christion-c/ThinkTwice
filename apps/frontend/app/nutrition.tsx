import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "./components/AppPreferences";
import BottomNav from "./components/BottomNav";
import PageScaffold from "./components/PageScaffold";
import { radii, spacing, type ThemeColors } from "./components/theme";

export default function Nutrition() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <PageScaffold
      title="Nutrition"
      subtitle="Keep meals simple, consistent, and easy to review."
      footer={<BottomNav active="Nutrition" />}
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Meal Log</Text>
        <Text style={styles.cardText}>You have not logged meals today. Add breakfast, lunch, or dinner to build your timeline.</Text>
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
      lineHeight: 22,
    },
  });
