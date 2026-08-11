import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { useThemeColors } from "../../components/AppPreferences";
import PageScaffold from "../../components/PageScaffold";
import { radii, spacing, type ThemeColors } from "../../components/theme";
import { loadJson, saveJson } from "../../lib/local-storage";

const NOTIFICATION_PREFS_STORAGE_KEY = "thinktwice.notificationPrefs.v1";

interface NotificationPrefs {
  fuelReminders: boolean;
  mealReminders: boolean;
  weeklySummary: boolean;
}

const defaultPrefs: NotificationPrefs = {
  fuelReminders: true,
  mealReminders: true,
  weeklySummary: false,
};

export default function Notifications() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs);
  const hasLoaded = useRef(false);

  useEffect(() => {
    let isMounted = true;

    void loadJson(NOTIFICATION_PREFS_STORAGE_KEY, defaultPrefs).then((stored) => {
      if (!isMounted) {
        return;
      }

      setPrefs(stored);
      hasLoaded.current = true;
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoaded.current) {
      return;
    }

    void saveJson(NOTIFICATION_PREFS_STORAGE_KEY, prefs);
  }, [prefs]);

  const updatePref = (key: keyof NotificationPrefs, value: boolean) => {
    setPrefs((current) => ({ ...current, [key]: value }));
  };

  return (
    <PageScaffold
      title="Notifications"
      subtitle="Choose what updates you want to receive."
    >
      <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}>
        <Text style={styles.backButtonLabel}>← Back</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notification Preferences</Text>
        <Text style={styles.cardText}>
          These preferences are saved on this device. Delivery is not wired
          up yet — this is where that will plug in once it is.
        </Text>

        <View style={styles.optionRow}>
          <View style={styles.optionTextWrap}>
            <Text style={styles.optionTitle}>Fuel Check-In Reminders</Text>
            <Text style={styles.optionCaption}>Nudge me to log fuel after a drive.</Text>
          </View>
          <Switch
            value={prefs.fuelReminders}
            onValueChange={(value) => updatePref("fuelReminders", value)}
            trackColor={{ false: colors.surfaceSoft, true: colors.accent }}
          />
        </View>

        <View style={styles.optionRow}>
          <View style={styles.optionTextWrap}>
            <Text style={styles.optionTitle}>Meal Check-In Reminders</Text>
            <Text style={styles.optionCaption}>Nudge me to log nutrition and food costs.</Text>
          </View>
          <Switch
            value={prefs.mealReminders}
            onValueChange={(value) => updatePref("mealReminders", value)}
            trackColor={{ false: colors.surfaceSoft, true: colors.accent }}
          />
        </View>

        <View style={styles.optionRow}>
          <View style={styles.optionTextWrap}>
            <Text style={styles.optionTitle}>Weekly Budget Summary</Text>
            <Text style={styles.optionCaption}>A recap of the week&apos;s spending and forecast.</Text>
          </View>
          <Switch
            value={prefs.weeklySummary}
            onValueChange={(value) => updatePref("weeklySummary", value)}
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
