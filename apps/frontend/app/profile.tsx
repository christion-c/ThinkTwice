import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback } from "react";
import { Pressable, Text, View } from "react-native";

import { useAppPreferences, useThemeColors } from "@/components/contexts/AppPreferencesProvider";
import { useAuth } from "@/components/contexts/AuthProvider";
import { useFinance } from "@/components/contexts/FinanceProvider";
import PageScaffold from "@/components/PageScaffold";
import { useVehicle } from "@/components/contexts/VehicleProvider";
import { ActionTile, CardRow, DashCard, HeroCard, HeroPill, KpiTile, MetricRow } from "@/components/ui";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";
import { withAlpha } from "@/lib/color";
import { formatCurrencyWhole } from "@/lib/money-format";

function initialsFor(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "?";
  }

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export default function Profile() {
  const colors = useThemeColors();
  const { colorMode, highContrast, remindersEnabled } = useAppPreferences();
  const { user } = useAuth();
  const { monthlyFuelBudget, fillUpHistory, dailyDrivingLogs, refresh: refreshFinance } = useFinance();
  const { backendUser, selectedVehicle, loading, refreshVehicles } = useVehicle();

  useRefetchOnFocus(
    useCallback(async () => {
      await Promise.all([refreshFinance(), refreshVehicles()]);
    }, [refreshFinance, refreshVehicles]),
  );

  const accountLabel = user?.displayName || user?.email || "Account owner";
  // Show the email as a secondary line only when the name above isn't
  // already the email.
  const accountEmail = user?.displayName && user.email ? user.email : null;
  const cloudStatus = backendUser ? "Synced" : loading ? "Syncing..." : "Not synced yet";
  const totalMilesLogged = dailyDrivingLogs.reduce((sum, log) => sum + log.milesDriven, 0);

  return (
    <PageScaffold
      title="Profile"
      subtitle="Manage account settings and verify your planner baseline."
      headerRight={
        <Pressable
          onPress={() => router.push("/settings/preferences")}
          accessibilityLabel="Open preferences"
          className="h-10 w-10 items-center justify-center rounded-round border border-border bg-surface"
        >
          <Ionicons name="settings-outline" size={20} color={colors.text} />
        </Pressable>
      }
      showNav
      navActive="Profile"
      dashboard
    >
      <HeroCard>
        <View className="flex-row items-center gap-lg">
          <View
            className="h-16 w-16 items-center justify-center rounded-round"
            style={{ backgroundColor: withAlpha(colors.accentDeep, 0.18) }}
          >
            <Text className="text-2xl font-bold text-accentDeep">{initialsFor(accountLabel)}</Text>
          </View>
          <View className="flex-1 gap-xs">
            <Text numberOfLines={1} className="text-xl font-bold text-accentDeep">
              {accountLabel}
            </Text>
            {accountEmail ? (
              <Text numberOfLines={1} className="text-caption text-accentDeep">
                {accountEmail}
              </Text>
            ) : null}
            <HeroPill label={cloudStatus} />
          </View>
        </View>
      </HeroCard>

      <CardRow>
        <DashCard title="Your activity" icon="analytics-outline" tint={colors.teal}>
          <View className="flex-row flex-wrap gap-sm">
            <KpiTile
              icon="car-outline"
              label="Active vehicle"
              value={selectedVehicle?.nickname ?? "None"}
              tint={colors.blue}
            />
            <KpiTile
              icon="water-outline"
              label="Monthly fuel"
              value={formatCurrencyWhole(monthlyFuelBudget)}
              tint={colors.accent}
            />
            <KpiTile icon="receipt-outline" label="Fill-ups logged" value={String(fillUpHistory.length)} tint={colors.teal} />
            <KpiTile
              icon="speedometer-outline"
              label="Miles logged"
              value={`${Math.round(totalMilesLogged).toLocaleString()} mi`}
              // The backend returns only the 60 most recent daily logs.
              caption="Last 60 check-ins"
              tint={colors.berry}
            />
          </View>
        </DashCard>

        <DashCard title="Preferences" icon="options-outline" tint={colors.berry}>
          <View>
            <MetricRow icon="moon-outline" label="Appearance" value={colorMode === "dark" ? "Dark" : "Light"} iconColor={colors.blue} />
            <View className="my-md h-px bg-border" />
            <MetricRow icon="contrast-outline" label="High contrast" value={highContrast ? "On" : "Off"} iconColor={colors.gold} />
            <View className="my-md h-px bg-border" />
            <MetricRow icon="notifications-outline" label="Reminders" value={remindersEnabled ? "On" : "Off"} iconColor={colors.success} />
          </View>
          <View className="flex-row flex-wrap gap-sm">
            <ActionTile
              title="App settings"
              icon="color-palette-outline"
              tint={colors.berry}
              onPress={() => router.push("/settings/preferences")}
            />
            <ActionTile
              title="Account"
              icon="person-circle-outline"
              tint={colors.blue}
              onPress={() => router.push("/settings/account")}
            />
          </View>
        </DashCard>
      </CardRow>
    </PageScaffold>
  );
}
