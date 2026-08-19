import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback } from "react";
import { Pressable, Text, View } from "react-native";

import { useAppPreferences, useThemeColors } from "../../components/AppPreferences";
import { useAuth } from "../../components/AuthProvider";
import BottomNav from "../../components/BottomNav";
import { useFinance } from "../../components/FinanceContext";
import PageScaffold from "../../components/PageScaffold";
import { useVehicle } from "../../components/VehicleContext";
import { useRefetchOnFocus } from "../../hooks/useRefetchOnFocus";

const moneyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function Profile() {
  const colors = useThemeColors();
  const { colorMode, highContrast, remindersEnabled } = useAppPreferences();
  const { user } = useAuth();
  const { monthlyFuelBudget, refresh: refreshFinance } = useFinance();
  const { backendUser, selectedVehicle, loading, refreshVehicles } = useVehicle();

  useRefetchOnFocus(
    useCallback(async () => {
      await Promise.all([refreshFinance(), refreshVehicles()]);
    }, [refreshFinance, refreshVehicles]),
  );

  const accountLabel = user?.displayName || user?.email || "Account owner";

  return (
    <PageScaffold
      title="Profile"
      subtitle="Manage account settings and verify your planner baseline."
      headerRight={
        <Pressable onPress={() => router.push("/settings/preferences")} className="rounded-[10px] px-1.5 py-1">
          <Ionicons name="settings-outline" size={20} color={colors.text} />
        </Pressable>
      }
      footer={<BottomNav active="Profile" />}
    >
      <View className="gap-sm rounded-lg border border-border bg-surface p-lg">
        <Text className="text-xl font-bold text-text">Account Snapshot</Text>
        <Text className="text-[15px] leading-[22px] text-textMuted">Signed in as {accountLabel}.</Text>
        <Text className="text-[15px] leading-[22px] text-textMuted">Cloud Status: {backendUser ? "Connected" : loading ? "Loading" : "Not synced yet"}</Text>
        <Text className="text-[15px] leading-[22px] text-textMuted">Current monthly fuel cost: {moneyFormat.format(monthlyFuelBudget)}</Text>
        <Text className="mt-0.5 text-sm font-semibold text-accent">Appearance: {colorMode === "dark" ? "Dark" : "Light"}</Text>
      </View>

      <View className="gap-sm rounded-lg border border-border bg-surface p-lg">
        <Text className="text-xl font-bold text-text">Account Details</Text>
        <Text className="text-[15px] leading-[22px] text-textMuted">Active vehicle: {selectedVehicle?.nickname ?? "None selected"}</Text>
        <Text className="text-[15px] leading-[22px] text-textMuted">High contrast: {highContrast ? "On" : "Off"}</Text>
        <Text className="text-[15px] leading-[22px] text-textMuted">Reminders: {remindersEnabled ? "On" : "Off"}</Text>
      </View>

    </PageScaffold>
  );
}
