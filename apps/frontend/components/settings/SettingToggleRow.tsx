import { Switch, Text, View } from "react-native";

import { useThemeColors } from "@/contexts/AppPreferencesProvider";

interface SettingToggleRowProps {
  title: string;
  caption: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

// A title/caption row with a trailing Switch, used by every settings screen with on/off preferences.
export default function SettingToggleRow({ title, caption, value, onValueChange }: SettingToggleRowProps) {
  const colors = useThemeColors();

  return (
    <View className="flex-row items-center justify-between gap-md border-t border-border py-2">
      <View className="flex-1 gap-0.5">
        <Text className="text-base font-semibold text-text">{title}</Text>
        <Text className="text-caption leading-[18px] text-textMuted">{caption}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: colors.surfaceSoft, true: colors.accent }} />
    </View>
  );
}
