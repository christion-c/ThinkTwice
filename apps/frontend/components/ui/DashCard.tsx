import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { Text, View } from "react-native";

import { useAppPreferences, useThemeColors } from "@/components/contexts/AppPreferencesProvider";
import { shadows } from "@/components/theme";
import { withAlpha } from "@/lib/color";

interface DashCardProps {
  title?: string;
  subtitle?: string;
  icon?: ComponentProps<typeof Ionicons>["name"];
  // The card's identity color - tints the header icon badge. Defaults
  // to the accent.
  tint?: string;
  // Trailing header content (a "View all" link, a refresh button).
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

// The bordered, elevated card the dashboard tabs (Home, Finance, Fuel,
// Profile) are built from: a colored icon badge + title header, then
// content. Unlike ui/Card (borderless section flow, still used by the
// form-style screens), every DashCard is its own visible panel, so each
// topic on a dashboard is clearly separated from the next. It fills
// its parent's height (grow) so cards paired in a CardRow line up.
export default function DashCard({
  title,
  subtitle,
  icon,
  tint,
  action,
  children,
  className = "",
}: DashCardProps) {
  const colors = useThemeColors();
  const { compactCards } = useAppPreferences();
  const tintColor = tint ?? colors.accent;
  const hasHeader = Boolean(title || icon || action);

  return (
    <View
      style={shadows.soft}
      className={`grow rounded-lg border border-border bg-surface ${compactCards ? "gap-md p-lg" : "gap-lg p-xl"} ${className}`}
    >
      {hasHeader ? (
        <View className="flex-row items-center gap-md">
          {icon ? (
            <View
              className="h-9 w-9 items-center justify-center rounded-sm"
              style={{ backgroundColor: withAlpha(tintColor, 0.16) }}
            >
              <Ionicons name={icon} size={18} color={tintColor} />
            </View>
          ) : null}
          <View className="flex-1 gap-0.5">
            {title ? <Text className="text-lg font-bold text-text">{title}</Text> : null}
            {subtitle ? <Text className="text-caption text-textMuted">{subtitle}</Text> : null}
          </View>
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}
