import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { useState } from "react";
import { Alert } from "react-native";

import { useAuth } from "@/components/contexts/AuthProvider";
import PageScaffold from "@/components/PageScaffold";
import SettingsBackButton from "@/components/settings/SettingsBackButton";
import { useVehicle } from "@/components/contexts/VehicleProvider";
import { Card, CardText, CardTitle, ListRow, StatusMessage } from "@/components/ui";
import { deleteCurrentUserAccount } from "@/lib/backend-api";
import { auth, isFirebaseConfigured } from "@/lib/firebase";

export default function Account() {
  const { user } = useAuth();
  const { backendUser, vehicles, selectedVehicle } = useVehicle();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Actually deletes the account (backend, then signs out locally) -
  // separated from the confirmation prompt below so the Alert.alert
  // callback stays simple.
  const performAccountDeletion = async () => {
    if (!user) {
      return;
    }

    setDeleteError("");

    try {
      setIsDeleting(true);
      await deleteCurrentUserAccount(user);

      // The backend account is gone - clear the local session too and
      // send the user to login, same as a normal sign-out.
      if (isFirebaseConfigured && auth) {
        await signOut(auth);
      }

      router.replace("/auth/login");
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Unable to delete your account. Try again.");
      setIsDeleting(false);
    }
  };

  // Same destructive-confirmation pattern as "Clear all history" in
  // app/history.tsx - a native Alert with a cancel option and a
  // destructive-styled confirm button, rather than a custom dialog.
  const confirmAccountDeletion = () => {
    Alert.alert(
      "Delete your account?",
      "This permanently deletes your account, every vehicle, and all budget, expense, and fill-up history tied to it. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => void performAccountDeletion(),
        },
      ],
    );
  };

  return (
    <PageScaffold
      title="Account"
      subtitle="Manage your personal details and account preferences."
      headerLeft={<SettingsBackButton onPress={() => router.replace("/settings/preferences")} />}
    >
      <Card surface>
        <CardTitle>Identity</CardTitle>
        <CardText>Email: {user?.email ?? "Not available"}</CardText>
        <CardText>Display name: {user?.displayName ?? "Not set"}</CardText>
        <CardText>Email verified: {user?.emailVerified ? "Yes" : "No"}</CardText>
      </Card>

      <Card surface>
        <CardTitle>Backend Sync</CardTitle>
        <CardText>Profile status: {backendUser ? "Connected" : "Not connected"}</CardText>
        <CardText>Vehicles stored: {vehicles.length}</CardText>
        <CardText>Selected vehicle: {selectedVehicle?.nickname ?? "None"}</CardText>
      </Card>

      <Card surface>
        <CardTitle>Next Steps</CardTitle>
        <ListRow title="Open profile overview" onPress={() => router.push("/profile")} />
        <ListRow title="Adjust app preferences" onPress={() => router.push("/settings/preferences")} />
        <ListRow title="Manage fill-up & check-in history" onPress={() => router.push("/history")} />
        <ListRow
          title={isDeleting ? "Deleting..." : "Delete my account"}
          danger
          onPress={confirmAccountDeletion}
        />
        <StatusMessage message={deleteError} tone="error" />
      </Card>
    </PageScaffold>
  );
}
