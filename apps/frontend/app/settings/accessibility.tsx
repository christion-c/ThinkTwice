import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { useAppPreferences, useThemeColors } from "../../components/AppPreferences";
import PageScaffold from "../../components/PageScaffold";
import { radii, spacing, type ThemeColors } from "../../components/theme";

export default function Accessibility() {
  const colors = useThemeColors();
  const { highContrast, setHighContrast } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <PageScaffold
      title="Accessibility"
      subtitle="Adjust the app to match your comfort and readability needs."
    >
      <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}>
        <Text style={styles.backButtonLabel}>← Back</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Accessibility Options</Text>
        <Text style={styles.cardText}>
          This setting applies everywhere in the app, not just this screen. Dark
          mode, compact cards, and quick hints live under Profile Settings.
        </Text>

        <View style={styles.optionRow}>
          <View style={styles.optionTextWrap}>
            <Text style={styles.optionTitle}>High Contrast Mode</Text>
            <Text style={styles.optionCaption}>
              Stronger text, background, and border contrast for easier reading.
            </Text>
          </View>
          <Switch
            value={highContrast}
            onValueChange={setHighContrast}
            trackColor={{ false: colors.surfaceSoft, true: colors.accent }}
          />
        </View>
      </View>
    </PageScaffold>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backButton: {
      alignSelf: "flex-start",
      marginBottom: spacing.sm,
    },
    backButtonLabel: {
      color: colors.accent,
      fontSize: 15,
      fontWeight: "600",
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
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
      marginBottom: spacing.xs,
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 6,
      gap: spacing.md,
    },
    optionTextWrap: {
      flex: 1,
      gap: 2,
    },
    optionTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
    },
    optionCaption: {
      color: colors.textMuted,
      fontSize: 14,
    },
    buttonPressed: {
      opacity: 0.85,
    },
  });
