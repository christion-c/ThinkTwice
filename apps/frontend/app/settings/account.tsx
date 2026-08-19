import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "../../components/AppPreferences";
import { useAuth } from "../../components/AuthProvider";
import PageScaffold from "../../components/PageScaffold";
import SettingsBackButton from "../../components/settings/SettingsBackButton";
import { useVehicle } from "../../components/VehicleContext";
import { radii, spacing, type ThemeColors } from "../../components/theme";

export default function Account() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const { backendUser, vehicles, selectedVehicle } = useVehicle();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <PageScaffold
      title="Account"
      subtitle="Manage your personal details and account preferences."
      headerLeft={<SettingsBackButton onPress={() => router.replace("/settings/preferences")} colors={colors} />}
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Identity</Text>
        <Text style={styles.cardText}>Email: {user?.email ?? "Not available"}</Text>
        <Text style={styles.cardText}>Display name: {user?.displayName ?? "Not set"}</Text>
        <Text style={styles.cardText}>Email verified: {user?.emailVerified ? "Yes" : "No"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Backend Sync</Text>
        <Text style={styles.cardText}>Profile status: {backendUser ? "Connected" : "Not connected"}</Text>
        <Text style={styles.cardText}>Vehicles stored: {vehicles.length}</Text>
        <Text style={styles.cardText}>Selected vehicle: {selectedVehicle?.nickname ?? "None"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Next Steps</Text>
        <Pressable onPress={() => router.push("/profile/profile")} style={styles.actionButton}>
          <Text style={styles.actionLabel}>Open profile overview</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/settings/preferences")} style={styles.actionButton}>
          <Text style={styles.actionLabel}>Adjust app preferences</Text>
        </Pressable>
      </View>
    </PageScaffold>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
    actionButton: {
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSoft,
      paddingHorizontal: spacing.md,
      paddingVertical: 14,
    },
    actionLabel: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "700",
    },
  });
