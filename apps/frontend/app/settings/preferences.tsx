import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";

import { useAppPreferences, useThemeColors } from "../../components/AppPreferences";
import PageScaffold from "../../components/PageScaffold";
import SettingsBackButton from "../../components/settings/SettingsBackButton";
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
      <View className="gap-sm rounded-lg border border-border bg-surface p-lg">
        <Text className="text-xl font-bold text-text">Appearance</Text>
        <Text className="text-[15px] leading-[22px] text-textMuted">Choose the app color mode.</Text>

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
      </View>

      <View className="gap-sm rounded-lg border border-border bg-surface p-lg">
        <Text className="text-xl font-bold text-text">Basic Options</Text>

        <View className="flex-row items-center justify-between gap-md py-1.5">
          <View className="flex-1 gap-0.5">
            <Text className="text-base font-semibold text-text">Compact Cards</Text>
            <Text className="text-sm text-textMuted">Use tighter spacing in cards.</Text>
          </View>
          <Switch value={compactCards} onValueChange={setCompactCards} trackColor={{ false: colors.surfaceSoft, true: colors.accent }} />
        </View>

        <View className="flex-row items-center justify-between gap-md py-1.5">
          <View className="flex-1 gap-0.5">
            <Text className="text-base font-semibold text-text">High Contrast</Text>
            <Text className="text-sm text-textMuted">Increase visual separation and stronger text colors.</Text>
          </View>
          <Switch value={highContrast} onValueChange={setHighContrast} trackColor={{ false: colors.surfaceSoft, true: colors.accent }} />
        </View>

      </View>

      <View className="gap-sm rounded-lg border border-border bg-surface p-lg">
        <Text className="text-xl font-bold text-text">Session</Text>
        <Text className="text-[15px] leading-[22px] text-textMuted">Sign out of your current account on this device.</Text>

        {logoutError ? <Text className="text-sm text-danger">{logoutError}</Text> : null}

        <Pressable
          onPress={handleLogout}
          disabled={isSigningOut}
          className="mt-xs items-center rounded-md border border-danger bg-transparent py-3 active:opacity-85 disabled:opacity-85"
        >
          <Text className="text-base font-bold text-danger">{isSigningOut ? "Signing out..." : "Log Out"}</Text>
        </Pressable>
      </View>
    </PageScaffold>
  );
}
