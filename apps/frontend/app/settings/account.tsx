import { router } from "expo-router";
import { Pressable, Text } from "react-native";

import { useThemeColors } from "../../components/AppPreferences";
import { useAuth } from "../../components/AuthProvider";
import PageScaffold from "../../components/PageScaffold";
import SettingsBackButton from "../../components/settings/SettingsBackButton";
import { useVehicle } from "../../components/VehicleContext";
import Card from "../../components/ui/Card";
import CardText from "../../components/ui/CardText";
import CardTitle from "../../components/ui/CardTitle";

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
      <Card>
        <CardTitle>Identity</CardTitle>
        <CardText>Email: {user?.email ?? "Not available"}</CardText>
        <CardText>Display name: {user?.displayName ?? "Not set"}</CardText>
        <CardText>Email verified: {user?.emailVerified ? "Yes" : "No"}</CardText>
      </Card>

      <Card>
        <CardTitle>Backend Sync</CardTitle>
        <CardText>Profile status: {backendUser ? "Connected" : "Not connected"}</CardText>
        <CardText>Vehicles stored: {vehicles.length}</CardText>
        <CardText>Selected vehicle: {selectedVehicle?.nickname ?? "None"}</CardText>
      </Card>

      <Card>
        <CardTitle>Next Steps</CardTitle>
        <Pressable onPress={() => router.push("/profile/profile")} className="rounded-md border border-border bg-surfaceSoft px-md py-3.5">
          <Text className="text-[15px] font-bold text-text">Open profile overview</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/settings/preferences")} className="rounded-md border border-border bg-surfaceSoft px-md py-3.5">
          <Text className="text-[15px] font-bold text-text">Adjust app preferences</Text>
        </Pressable>
      </Card>
    </PageScaffold>
  );
}
