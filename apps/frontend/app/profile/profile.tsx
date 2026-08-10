import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppPreferences, useThemeColors } from "../../components/AppPreferences";
import { useAuth } from "../../components/AuthProvider";
import BottomNav from "../../components/BottomNav";
import { useFinance } from "../../components/FinanceContext";
import PageScaffold from "../../components/PageScaffold";
import { radii, spacing, type ThemeColors } from "../../components/theme";
import { useVehicle } from "../../components/VehicleContext";

const moneyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function Profile() {
  const colors = useThemeColors();
  const { colorMode, highContrast, remindersEnabled, budgetAlertsEnabled } = useAppPreferences();
  const { user } = useAuth();
  const { monthlyFuelBudget } = useFinance();
  const { backendUser, vehicles, selectedVehicle, loading } = useVehicle();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const accountLabel = user?.displayName || user?.email || "Account owner";

  return (
    <PageScaffold
      title="Profile"
      subtitle="Manage account settings and verify your planner baseline."
      headerRight={
        <Pressable onPress={() => router.push("/settings/preferences")} style={styles.headerButton}>
          <Ionicons name="settings-outline" size={20} color={colors.text} />
        </Pressable>
      }
      footer={<BottomNav active="Profile" />}
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Snapshot</Text>
        <Text style={styles.cardText}>Signed in as {accountLabel}.</Text>
        <Text style={styles.cardText}>Backend profile: {backendUser ? "Connected" : loading ? "Loading" : "Not synced yet"}</Text>
        <Text style={styles.cardText}>Current monthly fuel reserve: {moneyFormat.format(monthlyFuelBudget)}</Text>
        <Text style={styles.modeText}>Appearance: {colorMode === "dark" ? "Dark" : "Light"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Planner Readiness</Text>
        <Text style={styles.cardText}>Vehicles on file: {vehicles.length}</Text>
        <Text style={styles.cardText}>Active vehicle: {selectedVehicle?.nickname ?? "None selected"}</Text>
        <Text style={styles.cardText}>High contrast: {highContrast ? "On" : "Off"}</Text>
        <Text style={styles.cardText}>Reminders: {remindersEnabled ? "On" : "Off"}</Text>
        <Text style={styles.cardText}>Budget alerts: {budgetAlertsEnabled ? "On" : "Off"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Access</Text>
        <Pressable onPress={() => router.push("/settings/account")} style={styles.linkRow}>
          <Text style={styles.linkLabel}>Account details</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
        <Pressable onPress={() => router.push("/settings/notifications")} style={styles.linkRow}>
          <Text style={styles.linkLabel}>Notifications</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
        <Pressable onPress={() => router.push("/settings/accessibility")} style={styles.linkRow}>
          <Text style={styles.linkLabel}>Accessibility</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      </View>
    </PageScaffold>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    headerButton: {
      paddingHorizontal: 6,
      paddingVertical: 4,
      borderRadius: 10,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
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
    modeText: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: "600",
      marginTop: 2,
    },
    linkRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    linkLabel: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "600",
    },
  });
