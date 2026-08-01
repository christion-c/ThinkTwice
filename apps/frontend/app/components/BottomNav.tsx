import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "./AppPreferences";
import { radii, shadows, spacing, type ThemeColors } from "./theme";

const tabs = [
  { label: "Nutrition", path: "/nutrition" },
  { label: "Home", path: "/" },
  { label: "Profile", path: "/profile/profile" },
  { label: "Fuel", path: "/fuel" },
] as const;

export default function BottomNav({ active }: { active: (typeof tabs)[number]["label"] }) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <View style={[styles.footer, shadows.elevated]}>
        {tabs.map((tab) => {
          const isActive = tab.label === active;
          return (
            <Pressable
              key={tab.label}
              style={({ pressed }) => [
                styles.navItem,
                isActive ? styles.navItemActive : styles.navItemInactive,
                pressed && styles.navItemPressed,
              ]}
              onPress={() => {
                if (!isActive) {
                  router.push(tab.path);
                }
              }}
            >
              <Text style={isActive ? styles.navLabelActive : styles.navLabel}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      backgroundColor: colors.background,
    },
    footer: {
      paddingVertical: 8,
      paddingHorizontal: spacing.sm,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: radii.lg,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    navItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      marginHorizontal: 4,
      borderRadius: radii.sm,
      paddingVertical: 9,
    },
    navItemInactive: {
      backgroundColor: "transparent",
    },
    navItemActive: {
      backgroundColor: "rgba(45, 212, 191, 0.2)",
    },
    navItemPressed: {
      opacity: 0.85,
    },
    navLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textMuted,
    },
    navLabelActive: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.accent,
    },
  });