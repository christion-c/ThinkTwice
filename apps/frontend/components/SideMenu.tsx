import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing } from "./theme";

export default function SideMenu() {
  return (
    <View style={styles.card}>
      <Pressable onPress={() => router.push("/")}>
        <Text style={styles.link}>Home</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/fuel")}>
        <Text style={styles.link}>Fuel</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/profile/profile")}>
        <Text style={styles.link}>Profile</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/nutrition")}>
        <Text style={styles.link}>Nutrition</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 260,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    gap: spacing.sm,
  },
  link: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: spacing.xs,
  },
});