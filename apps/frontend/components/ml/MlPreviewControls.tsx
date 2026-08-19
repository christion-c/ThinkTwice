import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import type { ThemeColors } from "../theme";

interface MlPreviewControlsProps {
  milesInput: string;
  onMilesChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string;
  idleLabel: string;
  loadingLabel: string;
  colors: ThemeColors;
}

// Miles-driven input, submit button, and the loading/error feedback beneath it.
export default function MlPreviewControls({
  milesInput,
  onMilesChange,
  onSubmit,
  loading,
  error,
  idleLabel,
  loadingLabel,
  colors,
}: MlPreviewControlsProps) {
  return (
    <>
      <View className="gap-sm">
        <View className="gap-1">
          <Text className="text-xs font-semibold uppercase tracking-[0.4px] text-text">Miles driven</Text>
          <TextInput
            value={milesInput}
            onChangeText={onMilesChange}
            keyboardType="numeric"
            className="rounded-md border border-border bg-background px-sm py-sm text-text"
            placeholder="120"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>

      <Pressable onPress={onSubmit} className="self-start rounded-md bg-accent px-md py-sm active:opacity-80">
        <Text className="text-sm font-semibold text-surface">{loading ? loadingLabel : idleLabel}</Text>
      </Pressable>

      {loading ? (
        <View className="flex-row items-center gap-sm">
          <ActivityIndicator color={colors.accent} />
          <Text className="text-sm leading-5 text-textMuted">Loading preview data...</Text>
        </View>
      ) : null}

      {error ? <Text className="text-sm text-danger">{error}</Text> : null}
    </>
  );
}
