import { StyleSheet, Text, View } from "react-native";

import { radii, spacing, typography } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";

interface MessageProps {
  text: string;
  /** "error" for things that went wrong; "info" for confirmations. */
  tone?: "error" | "info";
}

/** A short message above a form, announced to screen readers as soon as it appears. */
export function Message({ text, tone = "info" }: MessageProps) {
  const { colors } = useTheme();
  const accent = tone === "error" ? colors.error : colors.success;

  return (
    <View
      role={tone === "error" ? "alert" : "status"}
      style={[
        styles.box,
        { backgroundColor: colors.surfaceSoft, borderLeftColor: accent },
      ]}
    >
      <Text style={[typography.body, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderLeftWidth: 4, borderRadius: radii.control, padding: spacing.md },
});
