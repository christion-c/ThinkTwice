import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import type { ThemeColors } from "../theme";
import type { MlPreviewStyles } from "./ml-preview-styles";

interface MlPreviewControlsProps {
  milesInput: string;
  onMilesChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string;
  idleLabel: string;
  loadingLabel: string;
  colors: ThemeColors;
  styles: MlPreviewStyles;
}

/** Miles-driven input, submit button, and the loading/error feedback beneath it. */
export default function MlPreviewControls({
  milesInput,
  onMilesChange,
  onSubmit,
  loading,
  error,
  idleLabel,
  loadingLabel,
  colors,
  styles,
}: MlPreviewControlsProps) {
  return (
    <>
      <View style={styles.formRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Miles driven</Text>
          <TextInput
            value={milesInput}
            onChangeText={onMilesChange}
            keyboardType="numeric"
            style={styles.input}
            placeholder="120"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>

      <Pressable
        onPress={onSubmit}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
      >
        <Text style={styles.primaryButtonLabel}>{loading ? loadingLabel : idleLabel}</Text>
      </Pressable>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.text}>Loading preview data...</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </>
  );
}
