import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppPreferences, useThemeColors } from "../components/AppPreferences";
import BottomNav from "../components/BottomNav";
import PageScaffold from "../components/PageScaffold";
import { radii, spacing, type ThemeColors } from "../components/theme";

export default function Profile() {
  const colors = useThemeColors();
  const { colorMode } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <PageScaffold
      title="Profile"
      subtitle="Manage your account and keep your preferences up to date."
      headerRight={
        <Pressable onPress={() => router.push("/settings/preferences")} style={styles.headerButton}>
          <Ionicons name="settings-outline" size={20} color={colors.text} />
        </Pressable>
      }
      footer={<BottomNav active="Profile" />}
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Snapshot</Text>
        <Text style={styles.cardText}>Signed in as Parker. Visit settings to update account, notifications, and accessibility.</Text>
        <Text style={styles.modeText}>Appearance: {colorMode === "dark" ? "Dark" : "Light"}</Text>
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
  });
