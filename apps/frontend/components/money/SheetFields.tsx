import { Pressable, Text, TextInput, View } from "react-native";

import { useThemeColors } from "@/contexts/AppPreferencesProvider";
import { withAlpha } from "@/lib/color";

// Form pieces shared by the Finance tab's bottom sheets
// (MoneyItemSheet, PaycheckSheet).

export function Field({
  label,
  hint,
  money = false,
  keyboardType,
  ...inputProps
}: {
  label: string;
  hint?: string;
  money?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  autoCapitalize?: "none" | "words";
  autoFocus?: boolean;
  onFocus?: () => void;
  // Overrides the default keyboard (decimal pad for money, else default).
  keyboardType?: "numbers-and-punctuation";
}) {
  const colors = useThemeColors();

  return (
    <View className="gap-xs">
      <View className="flex-row items-baseline justify-between gap-sm">
        <Text className="text-caption font-semibold text-textMuted">{label}</Text>
        {hint ? <Text className="text-xs text-textMuted">{hint}</Text> : null}
      </View>
      <TextInput
        {...inputProps}
        keyboardType={keyboardType ?? (money ? "decimal-pad" : "default")}
        autoCorrect={false}
        placeholderTextColor={colors.textMuted}
        className="rounded-md border border-border bg-surfaceSoft px-md py-3 text-base text-text"
      />
    </View>
  );
}

export function ChipRow({
  options,
  selected,
  onSelect,
}: {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View className="flex-row gap-sm">
      {options.map((option) => (
        <View key={option.value} className="flex-1">
          <Chip label={option.label} selected={selected === option.value} onPress={() => onSelect(option.value)} stretch />
        </View>
      ))}
    </View>
  );
}

export function Chip({ label, selected, onPress, stretch = false }: { label: string; selected: boolean; onPress: () => void; stretch?: boolean }) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      className={`items-center rounded-round border px-md py-2 ${stretch ? "w-full" : ""} ${selected ? "border-accent" : "border-border bg-surfaceSoft"}`}
      style={selected ? { backgroundColor: withAlpha(colors.accent, 0.16) } : undefined}
    >
      <Text className={`text-caption font-semibold ${selected ? "text-accent" : "text-textMuted"}`}>{label}</Text>
    </Pressable>
  );
}
