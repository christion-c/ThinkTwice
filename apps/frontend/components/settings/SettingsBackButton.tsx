import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text } from "react-native";

import type { ThemeColors } from "../theme";

interface SettingsBackButtonProps {
  onPress: () => void;
  colors: ThemeColors;
}

/** The "← Back" pill every settings/account screen puts in its header. */
export default function SettingsBackButton({ onPress, colors }: SettingsBackButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-1.5 rounded-md border border-border bg-surfaceSoft px-2 py-1.5"
    >
      <Ionicons name="arrow-back" size={18} color={colors.text} />
      <Text className="text-sm font-semibold text-text">Back</Text>
    </Pressable>
  );
}
