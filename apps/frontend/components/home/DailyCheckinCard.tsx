import { Pressable, Text, TextInput, View } from "react-native";

import { useThemeColors } from "@/contexts/AppPreferencesProvider";
import { StatusMessage } from "@/components/ui";
import { useDailyCheckin } from "@/hooks/useDailyCheckin";

// Home's daily driving check-in: log today's miles once, feeding the
// Tank Forecast card's dailyMiles estimate directly (see
// computeFillUpStats in lib/fuel/projections.ts). Content only - the
// caller wraps this in a Card, matching components/fuel/VehicleSelector.
export default function DailyCheckinCard() {
  const colors = useThemeColors();
  const { milesInput, setMilesInput, todaysLog, showInput, startEditing, submit, saving, error } =
    useDailyCheckin();

  if (!showInput) {
    return (
      <View className="flex-row items-center gap-sm">
        <Text className="flex-1 text-sm text-textMuted">
          {todaysLog?.milesDriven} mi logged today
        </Text>
        <Pressable onPress={startEditing} className="active:opacity-70">
          <Text className="text-caption font-bold text-accent">Edit</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="gap-sm">
      <View className="flex-row items-center gap-sm">
        <TextInput
          value={milesInput}
          onChangeText={setMilesInput}
          keyboardType="decimal-pad"
          className="flex-1 rounded-md border border-border bg-background px-sm py-sm text-text"
          placeholder="Miles driven today"
          placeholderTextColor={colors.textMuted}
        />
        <Pressable
          onPress={submit}
          disabled={saving}
          className="rounded-md bg-accent px-md py-sm active:opacity-80"
        >
          <Text className="text-sm font-semibold text-accentDeep">{saving ? "Saving..." : "Log it"}</Text>
        </Pressable>
      </View>
      <StatusMessage message={error} tone="error" />
    </View>
  );
}
