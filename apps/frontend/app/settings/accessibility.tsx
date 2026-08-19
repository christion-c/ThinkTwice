import { router } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useAppPreferences, useThemeColors } from "../../components/AppPreferences";
import PageScaffold from "../../components/PageScaffold";
import SettingsBackButton from "../../components/settings/SettingsBackButton";
import SettingToggleRow from "../../components/settings/SettingToggleRow";
import { radii, spacing, type ThemeColors } from "../../components/theme";

export default function Accessibility() {
  const colors = useThemeColors();
  const {
    compactCards,
    setCompactCards,
    highContrast,
    setHighContrast,
  } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <PageScaffold
      title="Accessibility"
      subtitle="Adjust the app to match your comfort and readability needs."
      headerLeft={<SettingsBackButton onPress={() => router.replace("/settings/preferences")} colors={colors} />}
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Display Comfort</Text>
        <SettingToggleRow
          title="High contrast"
          caption="Stronger borders and text for easier scanning."
          value={highContrast}
          onValueChange={setHighContrast}
          colors={colors}
        />
        <SettingToggleRow
          title="Compact layout"
          caption="Tighter spacing if you prefer denser screens."
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
