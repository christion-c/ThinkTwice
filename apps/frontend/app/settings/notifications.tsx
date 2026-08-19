import { router } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useAppPreferences, useThemeColors } from "../../components/AppPreferences";
import PageScaffold from "../../components/PageScaffold";
import SettingsBackButton from "../../components/settings/SettingsBackButton";
import SettingToggleRow from "../../components/settings/SettingToggleRow";
import { radii, spacing, type ThemeColors } from "../../components/theme";

export default function DailyRhythmSettings() {
  const colors = useThemeColors();
  const {
    compactCards,
    setCompactCards,
    remindersEnabled,
    setRemindersEnabled,
  } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const activeCount = [remindersEnabled, compactCards].filter(Boolean).length;
  const modeLabel = activeCount >= 2 ? "Focused" : "Quiet";

  return (
    <PageScaffold
      title="Daily Rhythm"
      subtitle="Shape how the app supports your routine without feeling noisy."
      headerLeft={<SettingsBackButton onPress={() => router.replace("/settings/preferences")} colors={colors} />}
    >
      <View style={styles.heroCard}>
        <View style={styles.heroContent}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Demo-ready</Text>
          </View>
          <Text style={styles.heroTitle}>Your app, tuned for the day ahead</Text>
          <Text style={styles.heroCopy}>
            These controls are designed to feel polished and useful, whether you want a calmer dashboard or a more proactive planning flow.
          </Text>
        </View>

        <View style={styles.heroMetrics}>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{activeCount}/3</Text>
            <Text style={styles.metricLabel}>active habits</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{modeLabel}</Text>
            <Text style={styles.metricLabel}>focus mode</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily support</Text>
        <SettingToggleRow
          title="Check-in reminders"
          caption="Keep light follow-up prompts visible so your routine stays on track."
          value={remindersEnabled}
          onValueChange={setRemindersEnabled}
          colors={colors}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dashboard feel</Text>
        <SettingToggleRow
          title="Compact cards"
          caption="Use tighter spacing for a denser, more modern overview."
          value={compactCards}
          onValueChange={setCompactCards}
          colors={colors}
        />
      </View>
    </PageScaffold>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    heroCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.lg,
      gap: spacing.md,
    },
    heroContent: {
      gap: spacing.xs,
    },
    badge: {
      alignSelf: "flex-start",
      borderRadius: radii.round,
      backgroundColor: "rgba(45, 212, 191, 0.16)",
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    badgeText: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase" as const,
      letterSpacing: 0.8,
    },
    heroTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "700",
    },
    heroCopy: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 22,
    },
    heroMetrics: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    metricBox: {
      flex: 1,
      borderRadius: radii.md,
      backgroundColor: colors.surfaceSoft,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 10,
      paddingHorizontal: 12,
      alignItems: "center",
    },
    metricValue: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "700",
    },
    metricLabel: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 2,
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
  });
