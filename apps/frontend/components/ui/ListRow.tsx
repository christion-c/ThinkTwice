import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { useThemeColors } from "@/contexts/AppPreferencesProvider";
import { withAlpha } from "@/lib/color";

interface ListRowProps {
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  // Wraps the icon in an accent-tinted circle badge (the old
  // QuickActionRow look) instead of showing it plain (the setup
  // checklist's look).
  iconBadge?: boolean;
  showChevron?: boolean;
  // For destructive links (e.g. "Delete my account") - colors the
  // title text-danger instead of text-text.
  danger?: boolean;
  onPress: () => void;
}

// The "leading icon + title/description + trailing chevron" pressable
// row shared by Home's setup checklist, its Quick Actions list, and
// Settings' Next Steps links - previously copy-pasted three times with
// slightly different icon treatment and text sizing each time.
export default function ListRow({
  title,
  description,
  icon,
  iconColor,
  iconBadge = false,
  showChevron = true,
  danger = false,
  onPress,
}: ListRowProps) {
  const colors = useThemeColors();
  const resolvedIconColor = iconColor ?? colors.accent;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-sm rounded-md bg-surfaceSoft px-md py-3 transition-transform duration-150 ease-out active:scale-[0.98]"
    >
      {icon ? (
        iconBadge ? (
          <View
            className="items-center justify-center rounded-round p-sm"
            style={{ backgroundColor: withAlpha(colors.accent, 0.16) }}
          >
            <Ionicons name={icon} size={22} color={resolvedIconColor} />
          </View>
        ) : (
          <Ionicons name={icon} size={20} color={resolvedIconColor} />
        )
      ) : null}
      <View className="flex-1 gap-0.5">
        <Text className={`text-body font-bold ${danger ? "text-danger" : "text-text"}`}>{title}</Text>
        {description ? <Text className="text-caption leading-[18px] text-textMuted">{description}</Text> : null}
      </View>
      {showChevron ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null}
    </Pressable>
  );
}
