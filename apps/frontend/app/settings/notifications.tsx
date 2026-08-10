import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ExpoNotifications from "expo-notifications";
import { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { useAppPreferences, useThemeColors } from "../components/AppPreferences";
import PageScaffold from "../components/PageScaffold";
import { radii, spacing, type ThemeColors } from "../components/theme";

ExpoNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function NotificationsSettings() {
  const colors = useThemeColors();
  const {
    remindersEnabled,
    setRemindersEnabled,
    budgetAlertsEnabled,
    setBudgetAlertsEnabled,
  } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  useEffect(() => {
    const prepareNotifications = async () => {
      if (Platform.OS === "android") {
        await ExpoNotifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: ExpoNotifications.AndroidImportance.DEFAULT,
        });
      }

      const settings = await ExpoNotifications.getPermissionsAsync();
      setPermissionGranted(settings.granted || settings.ios?.status === ExpoNotifications.IosAuthorizationStatus.PROVISIONAL);
    };

    void prepareNotifications();
  }, []);

  const requestNotificationPermission = async () => {
    const settings = await ExpoNotifications.requestPermissionsAsync();
    const granted = settings.granted || settings.ios?.status === ExpoNotifications.IosAuthorizationStatus.PROVISIONAL;
    setPermissionGranted(granted);
    return granted;
  };

  const handleToggle = async (
    nextValue: boolean,
    setter: (value: boolean) => void,
  ) => {
    if (!nextValue) {
      setter(false);
      return;
    }

    const granted = permissionGranted ?? (await requestNotificationPermission());

    if (!granted) {
      setter(false);
      return;
    }

    setter(true);
  };

  const sendTestNotification = async () => {
    const granted = permissionGranted ?? (await requestNotificationPermission());

    if (!granted) {
      return;
    }

    await ExpoNotifications.scheduleNotificationAsync({
      content: {
        title: "ThinkTwice",
        body: "Notifications are working on this device.",
      },
      trigger: null,
    });
  };

  return (
    <PageScaffold
      title="Notifications"
      subtitle="Choose what updates you want to receive."
      headerLeft={
        <Pressable onPress={() => router.replace("/settings/preferences")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={18} color={colors.text} />
          <Text style={styles.backButtonLabel}>Back</Text>
        </Pressable>
      }
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reminder Center</Text>
        <NotificationRow
          title="Regular check-in reminders"
          caption="Keep weekly finance and fill-up follow-ups on your radar."
          value={remindersEnabled}
          onValueChange={(value) => {
            void handleToggle(value, setRemindersEnabled);
          }}
          colors={colors}
        />
        <NotificationRow
          title="Budget alerts"
          caption="Show budget risk prompts when projected free cash goes negative."
          value={budgetAlertsEnabled}
          onValueChange={(value) => {
            void handleToggle(value, setBudgetAlertsEnabled);
          }}
          colors={colors}
        />
        <Text style={styles.permissionText}>
          {permissionGranted === null
            ? "Checking notification permission..."
            : permissionGranted
              ? "Notifications are enabled on this device."
              : "Notifications are off until you allow permission on this device."}
        </Text>
        <Pressable onPress={() => { void sendTestNotification(); }} style={styles.testButton}>
          <Text style={styles.testButtonLabel}>Send test notification</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Current Behavior</Text>
        <Text style={styles.cardText}>
          {remindersEnabled
            ? "The app will keep showing check-in guidance on the dashboard and settings surfaces."
            : "Check-in reminders are muted, so the app will stay quieter during routine use."}
        </Text>
        <Text style={styles.cardText}>
          {budgetAlertsEnabled
            ? "Budget status warnings remain visible when your monthly plan turns negative."
            : "Budget warnings are minimized, though your totals still update normally."}
        </Text>
      </View>
    </PageScaffold>
  );
}

function NotificationRow({
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
    <View style={notificationRowStyles.row(colors)}>
      <View style={notificationRowStyles.copyWrap}>
        <Text style={notificationRowStyles.title(colors)}>{title}</Text>
        <Text style={notificationRowStyles.caption(colors)}>{caption}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: colors.surfaceSoft, true: colors.accent }} />
    </View>
  );
}

const notificationRowStyles = {
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
    permissionText: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 20,
      marginTop: spacing.xs,
    },
    testButton: {
      marginTop: spacing.xs,
      alignSelf: "flex-start",
      backgroundColor: colors.accent,
      borderRadius: radii.md,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    testButtonLabel: {
      color: "#0A0A0A",
      fontSize: 14,
      fontWeight: "700",
    },
  });
