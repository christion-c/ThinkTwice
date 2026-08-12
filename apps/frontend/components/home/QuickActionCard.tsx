import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text } from "react-native";

import type { ThemeColors } from "../theme";
import { quickActionStyles } from "./home.styles";

type Props = {
  colors: ThemeColors;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

export default function QuickActionCard({ colors, title, description, icon, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [quickActionStyles.card(colors), pressed && quickActionStyles.pressed]}>
      <Ionicons name={icon} size={20} color={colors.accent} />
      <Text style={quickActionStyles.title(colors)}>{title}</Text>
      <Text style={quickActionStyles.description(colors)}>{description}</Text>
    </Pressable>
  );
}
