import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { useAppPreferences, useThemeColors } from "../components/AppPreferences";
import PageScaffold from "../components/PageScaffold";
import { radii, spacing, type ThemeColors } from "../components/theme";
import { auth, isFirebaseConfigured } from "../../lib/firebase";

export default function ProfileSettings() {
  const colors = useThemeColors();
  const {
    colorMode,
    setColorMode,
    compactCards,
    setCompactCards,
    showHints,
    setShowHints,
    highContrast,
    setHighContrast,
  } = useAppPreferences();
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
      title="Profile Settings"
      subtitle="Adjust a few frontend app options for your experience."
      headerLeft={
        <Pressable onPress={() => router.replace("/profile/profile")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={18} color={colors.text} />
          <Text style={styles.backButtonLabel}>Back</Text>
        </Pressable>
      }
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Appearance</Text>
        <Text style={styles.cardText}>Choose the app color mode.</Text>

        <View style={styles.modeRow}>
          <Pressable
            onPress={() => setColorMode("dark")}
            style={[styles.modeButton, colorMode === "dark" && styles.modeButtonActive]}
          >
            <Text style={[styles.modeButtonLabel, colorMode === "dark" && styles.modeButtonLabelActive]}>Dark</Text>
          </Pressable>

          <Pressable
            onPress={() => setColorMode("light")}
            style={[styles.modeButton, colorMode === "light" && styles.modeButtonActive]}
          >
            <Text style={[styles.modeButtonLabel, colorMode === "light" && styles.modeButtonLabelActive]}>Light</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Basic Options</Text>

        <View style={styles.optionRow}>
          <View style={styles.optionTextWrap}>
            <Text style={styles.optionTitle}>Compact Cards</Text>
            <Text style={styles.optionCaption}>Use tighter spacing in cards.</Text>
          </View>
          <Switch value={compactCards} onValueChange={setCompactCards} trackColor={{ false: colors.surfaceSoft, true: colors.accent }} />
        </View>

        <View style={styles.optionRow}>
          <View style={styles.optionTextWrap}>
            <Text style={styles.optionTitle}>High Contrast</Text>
            <Text style={styles.optionCaption}>Increase visual separation and stronger text colors.</Text>
          </View>
          <Switch value={highContrast} onValueChange={setHighContrast} trackColor={{ false: colors.surfaceSoft, true: colors.accent }} />
        </View>

        <View style={styles.optionRow}>
          <View style={styles.optionTextWrap}>
            <Text style={styles.optionTitle}>Show Quick Hints</Text>
            <Text style={styles.optionCaption}>Display helper text under sections.</Text>
          </View>
          <Switch value={showHints} onValueChange={setShowHints} trackColor={{ false: colors.surfaceSoft, true: colors.accent }} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>More Controls</Text>
        <Pressable onPress={() => router.push("/settings/account")} style={styles.linkRow}>
          <Text style={styles.linkLabel}>Account details</Text>
          <Text style={styles.linkHint}>Profile and backend sync</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/settings/accessibility")} style={styles.linkRow}>
          <Text style={styles.linkLabel}>Accessibility</Text>
          <Text style={styles.linkHint}>Comfort and readability options</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/settings/notifications")} style={styles.linkRow}>
          <Text style={styles.linkLabel}>Notifications</Text>
          <Text style={styles.linkHint}>Reminders and alert preferences</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Session</Text>
        <Text style={styles.cardText}>Sign out of your current account on this device.</Text>

        {logoutError ? <Text style={styles.errorText}>{logoutError}</Text> : null}

        <Pressable
          onPress={handleLogout}
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
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: radii.md,
      backgroundColor: colors.surfaceSoft,
      borderWidth: 1,
      borderColor: colors.border,
    },
    backButtonLabel: {
      color: colors.text,
      fontSize: 14,
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
    modeRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    modeButton: {
      flex: 1,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSoft,
      paddingVertical: 12,
      alignItems: "center",
    },
    modeButtonActive: {
      borderColor: colors.accent,
      backgroundColor: "rgba(45, 212, 191, 0.2)",
    },
    modeButtonLabel: {
      color: colors.textMuted,
      fontSize: 15,
      fontWeight: "600",
    },
    modeButtonLabelActive: {
      color: colors.accent,
      fontWeight: "700",
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 6,
      gap: spacing.md,
    },
    optionTextWrap: {
      flex: 1,
      gap: 2,
    },
    optionTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
    },
    optionCaption: {
      color: colors.textMuted,
      fontSize: 14,
    },
    linkRow: {
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSoft,
      paddingHorizontal: spacing.md,
      paddingVertical: 14,
      gap: 4,
    },
    linkLabel: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "700",
    },
    linkHint: {
      color: colors.textMuted,
      fontSize: 13,
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
