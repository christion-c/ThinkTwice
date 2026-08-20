import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useAppPreferences, useThemeColors } from "../../components/AppPreferences";
import PageScaffold from "../../components/PageScaffold";
import SettingsBackButton from "../../components/settings/SettingsBackButton";
import SettingToggleRow from "../../components/settings/SettingToggleRow";
import Card from "../../components/ui/Card";
import CardText from "../../components/ui/CardText";
import CardTitle from "../../components/ui/CardTitle";
import StatusMessage from "../../components/ui/StatusMessage";
import { auth, isFirebaseConfigured } from "../../lib/firebase";

export default function ProfileSettings() {
  const colors = useThemeColors();
  const {
    colorMode,
    setColorMode,
    compactCards,
    setCompactCards,
    highContrast,
    setHighContrast,
  } = useAppPreferences();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

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
      headerLeft={<SettingsBackButton onPress={() => router.replace("/profile/profile")} colors={colors} />}
    >
      <Card>
        <CardTitle>Appearance</CardTitle>
        <CardText>Choose the app color mode.</CardText>

        <View className="flex-row gap-sm">
          <Pressable
            onPress={() => setColorMode("dark")}
            className={`flex-1 items-center rounded-md border py-3 ${
              colorMode === "dark" ? "border-accent bg-[rgba(45,212,191,0.2)]" : "border-border bg-surfaceSoft"
            }`}
          >
            <Text className={`text-[15px] ${colorMode === "dark" ? "font-bold text-accent" : "font-semibold text-textMuted"}`}>
              Dark
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setColorMode("light")}
            className={`flex-1 items-center rounded-md border py-3 ${
              colorMode === "light" ? "border-accent bg-[rgba(45,212,191,0.2)]" : "border-border bg-surfaceSoft"
            }`}
          >
            <Text className={`text-[15px] ${colorMode === "light" ? "font-bold text-accent" : "font-semibold text-textMuted"}`}>
              Light
            </Text>
          </Pressable>
        </View>
      </Card>

      <Card>
        <CardTitle>Basic Options</CardTitle>

        <SettingToggleRow
          title="Compact Cards"
          caption="Use tighter spacing in cards."
          value={compactCards}
          onValueChange={setCompactCards}
          colors={colors}
        />

        <SettingToggleRow
          title="High Contrast"
          caption="Increase visual separation and stronger text colors."
          value={highContrast}
          onValueChange={setHighContrast}
          colors={colors}
        />
      </Card>

      <Card>
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
