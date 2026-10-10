import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

import { useThemeColors } from "@/contexts/AppPreferencesProvider";
import { withAlpha } from "@/lib/color";

// The small round add/edit button in a Finance card's header.
export default function IconButton({ icon, label, onPress }: { icon: "add" | "create-outline"; label: string; onPress: () => void }) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      className="h-9 w-9 items-center justify-center rounded-round active:opacity-70"
      style={{ backgroundColor: withAlpha(colors.accent, 0.16) }}
    >
      <Ionicons name={icon} size={18} color={colors.accent} />
    </Pressable>
  );
}
