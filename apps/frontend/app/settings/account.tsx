import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "../../components/AppPreferences";
import { useAuth } from "../../components/AuthProvider";
import PageScaffold from "../../components/PageScaffold";
import { radii, spacing, type ThemeColors } from "../../components/theme";
import { useVehicle } from "../../components/VehicleContext";
import { auth, isFirebaseConfigured } from "../../lib/firebase";

export default function Account() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const { backendUser } = useVehicle();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
      title="Account"
      subtitle="Manage your personal details and account preferences."
    >
      <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}>
        <Text style={styles.backButtonLabel}>← Back</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Details</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Email</Text>
          <Text style={styles.detailValue}>{user?.email ?? "—"}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Display name</Text>
          <Text style={styles.detailValue}>{user?.displayName ?? "Not set"}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Email verified</Text>
          <Text style={styles.detailValue}>{backendUser?.emailVerified ? "Yes" : "No"}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Member since</Text>
          <Text style={styles.detailValue}>
            {backendUser ? new Date(backendUser.createdAt).toLocaleDateString() : "—"}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Session</Text>
        <Text style={styles.cardText}>Sign out of your current account on this device.</Text>

        {logoutError ? <Text style={styles.errorText}>{logoutError}</Text> : null}

        <Pressable
          onPress={() => {
            void handleLogout();
          }}
          disabled={isSigningOut}
          style={({ pressed }) => [styles.logoutButton, (pressed || isSigningOut) && styles.buttonPressed]}
        >
          <Text style={styles.logoutButtonLabel}>{isSigningOut ? "Signing out..." : "Log Out"}</Text>
        </Pressable>
      </View>
    </PageScaffold>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backButton: {
      alignSelf: "flex-start",
      marginBottom: spacing.sm,
    },
    backButtonLabel: {
      color: colors.accent,
      fontSize: 15,
      fontWeight: "600",
    },
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
      marginBottom: spacing.xs,
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 6,
      gap: spacing.md,
    },
    detailLabel: {
      color: colors.textMuted,
      fontSize: 14,
    },
    detailValue: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "600",
    },
    logoutButton: {
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.danger,
      backgroundColor: "transparent",
      paddingVertical: 12,
      alignItems: "center",
      marginTop: spacing.xs,
    },
    logoutButtonLabel: {
      color: colors.danger,
      fontSize: 16,
      fontWeight: "700",
    },
    errorText: {
      color: colors.danger,
      fontSize: 14,
    },
    buttonPressed: {
      opacity: 0.85,
    },
  });
