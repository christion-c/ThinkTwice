import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useAppPreferences, useThemeColors } from "@/components/contexts/AppPreferencesProvider";
import PageScaffold from "@/components/PageScaffold";
import SettingsBackButton from "@/components/settings/SettingsBackButton";
import SettingToggleRow from "@/components/settings/SettingToggleRow";
import { Card, CardText, CardTitle, StatusMessage } from "@/components/ui";
import { useCheckinReminders } from "@/hooks/useCheckinReminders";
import { withAlpha } from "@/lib/color";
import { auth, isFirebaseConfigured } from "@/lib/firebase";

// Converts the persisted "HH:mm" reminder time into a Date, since that's
// what DateTimePicker works with - only the hour/minute matter, so
// today's date is just a placeholder carrier for them.
function reminderTimeToDate(reminderTime: string): Date {
  const [hour, minute] = reminderTime.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

// Reverses reminderTimeToDate, back into the "HH:mm" string preferences are stored as.
function dateToReminderTime(date: Date): string {
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
}

export default function ProfileSettings() {
  const colors = useThemeColors();
  const {
    colorMode,
    setColorMode,
    compactCards,
    setCompactCards,
    highContrast,
    setHighContrast,
    remindersEnabled,
    setRemindersEnabled,
    reminderTime,
    setReminderTime,
  } = useAppPreferences();
  // Also mounted in app/_layout.tsx so the schedule stays active app-wide;
  // calling it again here is safe (scheduling/permission requests are
  // idempotent) and gets this screen its own up-to-date permissionDenied.
  const { permissionDenied } = useCheckinReminders();
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const handleReminderTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    // Close after any selection rather than leaving the picker open -
    // simplest behavior that's correct on both platforms; tap the time
    // again to reopen it.
    setShowReminderTimePicker(false);

    if (event.type === "set" && selectedDate) {
      setReminderTime(dateToReminderTime(selectedDate));
    }
  };

  const handleLogout = async () => {
    setLogoutError("");

    if (!isFirebaseConfigured || !auth) {
      setLogoutError("Firebase is not configured yet. Logout is unavailable in preview mode.");
      return;
    }

    try {
      setIsSigningOut(true);
      await signOut(auth);
      router.replace("/auth/login");
    } catch {
      setLogoutError("Unable to sign out right now. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <PageScaffold
      title="Profile Settings"
      subtitle="Adjust a few frontend app options for your experience."
      headerLeft={<SettingsBackButton onPress={() => router.replace("/profile")} />}
    >
      <Card surface>
        <CardTitle>Appearance</CardTitle>
        <CardText>Choose the app color mode.</CardText>

        <View className="flex-row gap-sm">
          <Pressable
            onPress={() => setColorMode("dark")}
            style={colorMode === "dark" ? { backgroundColor: withAlpha(colors.accent, 0.2) } : undefined}
            className={`flex-1 items-center rounded-md border py-3 ${
              colorMode === "dark" ? "border-accent" : "border-border bg-surfaceSoft"
            }`}
          >
            <Text className={`text-body ${colorMode === "dark" ? "font-bold text-accent" : "font-semibold text-textMuted"}`}>
              Dark
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setColorMode("light")}
            style={colorMode === "light" ? { backgroundColor: withAlpha(colors.accent, 0.2) } : undefined}
            className={`flex-1 items-center rounded-md border py-3 ${
              colorMode === "light" ? "border-accent" : "border-border bg-surfaceSoft"
            }`}
          >
            <Text className={`text-body ${colorMode === "light" ? "font-bold text-accent" : "font-semibold text-textMuted"}`}>
              Light
            </Text>
          </Pressable>
        </View>
      </Card>

      <Card surface>
        <CardTitle>Basic Options</CardTitle>

        <SettingToggleRow
          title="Compact Cards"
          caption="Use tighter spacing in cards."
          value={compactCards}
          onValueChange={setCompactCards}
        />

        <SettingToggleRow
          title="High Contrast"
          caption="Increase visual separation and stronger text colors."
          value={highContrast}
          onValueChange={setHighContrast}
        />

        <SettingToggleRow
          title="Check-In Reminders"
          caption="Keep light follow-up prompts visible so your routine stays on track."
          value={remindersEnabled}
          onValueChange={setRemindersEnabled}
        />

        {remindersEnabled ? (
          <View className="gap-xs border-t border-border py-2">
            <Pressable
              onPress={() => setShowReminderTimePicker(true)}
              className="flex-row items-center justify-between"
            >
              <Text className="text-base font-semibold text-text">Reminder time</Text>
              <Text className="text-body font-bold text-accent">
                {reminderTimeToDate(reminderTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </Text>
            </Pressable>

            {showReminderTimePicker ? (
              <DateTimePicker
                value={reminderTimeToDate(reminderTime)}
                mode="time"
                onChange={handleReminderTimeChange}
              />
            ) : null}

            <StatusMessage
              message={permissionDenied ? "Notifications are turned off for ThinkTwice in your device settings - enable them to receive this reminder." : null}
              tone="error"
            />
          </View>
        ) : null}
      </Card>

      <Card surface>
        <CardTitle>Account</CardTitle>
        <CardText>View account details or request data deletion.</CardText>
        <Pressable
          onPress={() => router.push("/settings/account")}
          className="mt-xs rounded-md border border-border bg-surfaceSoft px-md py-3.5"
        >
          <Text className="text-body font-bold text-text">Account details</Text>
        </Pressable>
      </Card>

      <Card surface>
        <CardTitle>Session</CardTitle>
        <CardText>Sign out of your current account on this device.</CardText>

        <StatusMessage message={logoutError} tone="error" />

        <Pressable
          onPress={handleLogout}
          disabled={isSigningOut}
          className="mt-xs items-center rounded-md border border-danger bg-transparent py-3 active:opacity-85 disabled:opacity-85"
        >
          <Text className="text-base font-bold text-danger">{isSigningOut ? "Signing out..." : "Log Out"}</Text>
        </Pressable>
      </Card>
    </PageScaffold>
  );
}
