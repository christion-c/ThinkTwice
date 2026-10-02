import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";

import { withAlpha } from "@/lib/color";

interface ActionTileProps {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  description?: string;
  tint: string;
  onPress: () => void;
}

// A tappable, color-tinted shortcut tile - the card-grid counterpart to
// ListRow. Tiles grow to share their row (two per row on a phone inside
// a flex-wrap container), so a set of shortcuts fills the card width.
export default function ActionTile({ icon, title, description, tint, onPress }: ActionTileProps) {
  return (
    <Pressable
      onPress={onPress}
      className="min-w-[40%] flex-1 gap-sm rounded-md p-lg transition-transform duration-150 ease-out active:scale-[0.97]"
      style={{ backgroundColor: withAlpha(tint, 0.14) }}
    >
      <View className="flex-row items-center justify-between">
        <View
          className="h-9 w-9 items-center justify-center rounded-round"
          style={{ backgroundColor: withAlpha(tint, 0.22) }}
        >
          <Ionicons name={icon} size={18} color={tint} />
        </View>
        <Ionicons name="arrow-forward" size={16} color={tint} />
      </View>
      <View className="gap-0.5">
        <Text className="text-body font-bold text-text">{title}</Text>
        {description ? <Text className="text-caption leading-[18px] text-textMuted">{description}</Text> : null}
      </View>
    </Pressable>
  );
}
