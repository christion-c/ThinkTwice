import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { useState } from "react";
import { Alert, TextInput, View } from "react-native";

import { useThemeColors } from "@/contexts/AppPreferencesProvider";
import { useAuth } from "@/contexts/AuthProvider";
import PageScaffold from "@/components/layout/PageScaffold";
import SettingsBackButton from "@/components/settings/SettingsBackButton";
import { useVehicle } from "@/contexts/VehicleProvider";
import { Card, CardText, CardTitle, ListRow, PrimaryButton, StatusMessage } from "@/components/ui";
import { deleteCurrentUserAccount } from "@/lib/api/backend";
import { auth, isFirebaseConfigured } from "@/lib/firebase";

const MAX_DISPLAY_NAME_LENGTH = 60;

export default function Account() {
  const colors = useThemeColors();
  const { user, updateDisplayName } = useAuth();
  const { backendUser, vehicles, selectedVehicle } = useVehicle();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [nameDraft, setNameDraft] = useState(user?.displayName ?? "");
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameStatus, setNameStatus] = useState<{ message: string; tone: "error" | "success" } | null>(null);

  const trimmedName = nameDraft.trim();
  const nameChanged = trimmedName !== (user?.displayName ?? "");

  const saveDisplayName = async () => {
    if (!trimmedName) {
      setNameStatus({ message: "Enter a name.", tone: "error" });
      return;
    }

    setNameStatus(null);
    setIsSavingName(true);

    try {
      await updateDisplayName(trimmedName);
      setNameDraft(trimmedName);
      setNameStatus({ message: "Name saved.", tone: "success" });
    } catch (error) {
      setNameStatus({ message: error instanceof Error ? error.message : "Couldn't save your name. Try again.", tone: "error" });
    } finally {
      setIsSavingName(false);
    }
  };

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
      // Reached from both Profile and Preferences, so go back to
      // whichever opened it; a direct web load has no history.
      headerLeft={
        <SettingsBackButton onPress={() => (router.canGoBack() ? router.back() : router.replace("/profile"))} />
      }
    >
      <Card surface>
        <CardTitle>Identity</CardTitle>
        <View className="gap-1.5">
          <CardText>Display name</CardText>
          <TextInput
            value={nameDraft}
            onChangeText={(value) => {
              setNameDraft(value);
              setNameStatus(null);
            }}
            maxLength={MAX_DISPLAY_NAME_LENGTH}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            returnKeyType="done"
            onSubmitEditing={() => void saveDisplayName()}
            accessibilityLabel="Display name"
            className="rounded-sm border border-border bg-surfaceSoft px-sm py-3 text-base text-text"
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <PrimaryButton
          label={isSavingName ? "Saving..." : "Save name"}
          disabled={!nameChanged || isSavingName}
          onPress={() => void saveDisplayName()}
        />
        <StatusMessage message={nameStatus?.message ?? ""} tone={nameStatus?.tone ?? "error"} />
        <CardText>Email: {user?.email ?? "Not available"}</CardText>
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
