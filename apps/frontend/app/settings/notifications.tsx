import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { useAppPreferences, useThemeColors } from "../../components/AppPreferences";
import PageScaffold from "../../components/PageScaffold";
import { radii, spacing, type ThemeColors } from "../../components/theme";

export default function DailyRhythmSettings() {
  const colors = useThemeColors();
  const {
    compactCards,
    setCompactCards,
    remindersEnabled,
    setRemindersEnabled,
    budgetAlertsEnabled,
    setBudgetAlertsEnabled,
  } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const activeCount = [remindersEnabled, budgetAlertsEnabled, compactCards].filter(Boolean).length;
  const modeLabel = activeCount >= 3 ? "Balanced" : activeCount >= 2 ? "Focused" : "Quiet";

  return (
    <PageScaffold
      title="Daily Rhythm"
      subtitle="Shape how the app supports your routine without feeling noisy."
      headerLeft={
        <Pressable onPress={() => router.replace("/settings/preferences")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={18} color={colors.text} />
          <Text style={styles.backButtonLabel}>Back</Text>
        </Pressable>
      }
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
            <Text style={styles.metricValue}>{activeCount}/4</Text>
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
        <SettingRow
          title="Check-in reminders"
          caption="Keep light follow-up prompts visible so your routine stays on track."
          value={remindersEnabled}
          onValueChange={setRemindersEnabled}
          colors={colors}
        />
        <SettingRow
          title="Budget alerts"
          caption="Surface budget risk prompts before a small miss turns into a bigger problem."
          value={budgetAlertsEnabled}
          onValueChange={setBudgetAlertsEnabled}
          colors={colors}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dashboard feel</Text>
        <SettingRow
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

function SettingRow({
  title,
  caption,
  value,
  onValueChange,
  colors,
}: {
  title: string;
  caption: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  colors: ThemeColors;
}) {
  return (
    <View style={settingRowStyles.row(colors)}>
      <View style={settingRowStyles.copyWrap}>
        <Text style={settingRowStyles.title(colors)}>{title}</Text>
        <Text style={settingRowStyles.caption(colors)}>{caption}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: colors.surfaceSoft, true: colors.accent }} />
    </View>
  );
}

const settingRowStyles = {
  row: (colors: ThemeColors) => ({
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: spacing.md,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  }),
  copyWrap: {
    flex: 1,
    gap: 2,
  },
  title: (colors: ThemeColors) => ({
    color: colors.text,
    fontSize: 16,
    fontWeight: "600" as const,
  }),
  caption: (colors: ThemeColors) => ({
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  }),
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: radii.md,
      backgroundColor: colors.surfaceSoft,
      borderWidth: 1,
      borderColor: colors.border,
    },
    backButtonLabel: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "600",
    },
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
    cardText: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 22,
    },
  });
