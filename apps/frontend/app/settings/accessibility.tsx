import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { useAppPreferences, useThemeColors } from "../../components/AppPreferences";
import PageScaffold from "../../components/PageScaffold";
import { radii, spacing, type ThemeColors } from "../../components/theme";

export default function Accessibility() {
  const colors = useThemeColors();
  const {
    compactCards,
    setCompactCards,
    showHints,
    setShowHints,
    highContrast,
    setHighContrast,
  } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <PageScaffold
      title="Accessibility"
      subtitle="Adjust the app to match your comfort and readability needs."
      headerLeft={
        <Pressable onPress={() => router.replace("/settings/preferences")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={18} color={colors.text} />
          <Text style={styles.backButtonLabel}>Back</Text>
        </Pressable>
      }
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Display Comfort</Text>
        <SettingRow
          title="High contrast"
          caption="Stronger borders and text for easier scanning."
          value={highContrast}
          onValueChange={setHighContrast}
          colors={colors}
        />
        <SettingRow
          title="Compact layout"
          caption="Tighter spacing if you prefer denser screens."
          value={compactCards}
          onValueChange={setCompactCards}
          colors={colors}
        />
        <SettingRow
          title="Show guidance"
          caption="Keep helper hints visible under sections."
          value={showHints}
          onValueChange={setShowHints}
          colors={colors}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Current Setup</Text>
        <Text style={styles.cardText}>High contrast: {highContrast ? "On" : "Off"}</Text>
        <Text style={styles.cardText}>Compact layout: {compactCards ? "On" : "Off"}</Text>
        <Text style={styles.cardText}>Guidance hints: {showHints ? "On" : "Off"}</Text>
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
    lineHeight: 19,
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
