import { StyleSheet, Switch, Text, View } from "react-native";

import { spacing, type ThemeColors } from "../theme";

interface SettingToggleRowProps {
  title: string;
  caption: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  colors: ThemeColors;
}

/** A title/caption row with a trailing Switch, used by every settings screen with on/off preferences. */
export default function SettingToggleRow({ title, caption, value, onValueChange, colors }: SettingToggleRowProps) {
  const styles = createStyles(colors);

  return (
    <View style={styles.row}>
      <View style={styles.copyWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.caption}>{caption}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: colors.surfaceSoft, true: colors.accent }} />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    copyWrap: {
      flex: 1,
      gap: 2,
    },
    title: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
    },
    caption: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
  });
