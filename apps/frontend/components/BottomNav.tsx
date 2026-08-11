import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppPreferences, useThemeColors } from "./AppPreferences";
import { radii, shadows, spacing, type ThemeColors } from "./theme";

const tabs = [
  { label: "Finance", path: "/finance", icon: "wallet-outline", activeIcon: "wallet" },
  { label: "Home", path: "/", icon: "home-outline", activeIcon: "home" },
  { label: "Fuel", path: "/fuel", icon: "car-outline", activeIcon: "car" },
  { label: "Nutrition", path: "/nutrition", icon: "restaurant-outline", activeIcon: "restaurant" },
  { label: "Profile", path: "/profile/profile", icon: "person-outline", activeIcon: "person" },
] as const;

export default function BottomNav({ active }: { active: (typeof tabs)[number]["label"] }) {
  const colors = useThemeColors();
  const { compactCards } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors, compactCards), [colors, compactCards]);

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
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={compactCards ? 16 : 18}
                color={isActive ? colors.accent : colors.textMuted}
              />
              <Text style={isActive ? styles.navLabelActive : styles.navLabel}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors, compactCards: boolean) =>
  StyleSheet.create({
    wrap: {
      paddingHorizontal: compactCards ? spacing.sm : spacing.md,
      paddingBottom: compactCards ? spacing.sm : spacing.md,
      backgroundColor: colors.background,
    },
    footer: {
      paddingVertical: compactCards ? 6 : 8,
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
      paddingVertical: compactCards ? 8 : 9,
      gap: 4,
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
      fontSize: compactCards ? 12 : 13,
      fontWeight: "600",
      color: colors.textMuted,
    },
    navLabelActive: {
      fontSize: compactCards ? 12 : 13,
      fontWeight: "700",
      color: colors.accent,
    },
  });