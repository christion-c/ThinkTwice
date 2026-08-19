import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { useThemeColors } from "../../components/AppPreferences";
import { useAuth } from "../../components/AuthProvider";
import PageScaffold from "../../components/PageScaffold";
import SettingsBackButton from "../../components/settings/SettingsBackButton";
import { useVehicle } from "../../components/VehicleContext";

export default function Account() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const { backendUser, vehicles, selectedVehicle } = useVehicle();

  return (
    <PageScaffold
      title="Account"
      subtitle="Manage your personal details and account preferences."
      headerLeft={<SettingsBackButton onPress={() => router.replace("/settings/preferences")} colors={colors} />}
    >
      <View className="gap-sm rounded-lg border border-border bg-surface p-lg">
        <Text className="text-xl font-bold text-text">Identity</Text>
        <Text className="text-[15px] leading-[22px] text-textMuted">Email: {user?.email ?? "Not available"}</Text>
        <Text className="text-[15px] leading-[22px] text-textMuted">Display name: {user?.displayName ?? "Not set"}</Text>
        <Text className="text-[15px] leading-[22px] text-textMuted">Email verified: {user?.emailVerified ? "Yes" : "No"}</Text>
      </View>

      <View className="gap-sm rounded-lg border border-border bg-surface p-lg">
        <Text className="text-xl font-bold text-text">Backend Sync</Text>
        <Text className="text-[15px] leading-[22px] text-textMuted">Profile status: {backendUser ? "Connected" : "Not connected"}</Text>
        <Text className="text-[15px] leading-[22px] text-textMuted">Vehicles stored: {vehicles.length}</Text>
        <Text className="text-[15px] leading-[22px] text-textMuted">Selected vehicle: {selectedVehicle?.nickname ?? "None"}</Text>
      </View>

      <View className="gap-sm rounded-lg border border-border bg-surface p-lg">
        <Text className="text-xl font-bold text-text">Next Steps</Text>
        <Pressable onPress={() => router.push("/profile/profile")} className="rounded-md border border-border bg-surfaceSoft px-md py-3.5">
          <Text className="text-[15px] font-bold text-text">Open profile overview</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/settings/preferences")} className="rounded-md border border-border bg-surfaceSoft px-md py-3.5">
          <Text className="text-[15px] font-bold text-text">Adjust app preferences</Text>
        </Pressable>
      </View>
    </PageScaffold>
  );
}
