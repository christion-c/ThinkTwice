import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

import { radii, type ThemeColors } from "../theme";

interface SettingsBackButtonProps {
  onPress: () => void;
  colors: ThemeColors;
}

/** The "← Back" pill every settings/account screen puts in its header. */
export default function SettingsBackButton({ onPress, colors }: SettingsBackButtonProps) {
  const styles = createStyles(colors);

  return (
    <Pressable onPress={onPress} style={styles.backButton}>
      <Ionicons name="arrow-back" size={18} color={colors.text} />
      <Text style={styles.backButtonLabel}>Back</Text>
    </Pressable>
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
  });
