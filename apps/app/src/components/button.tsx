import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { MIN_TOUCH_TARGET, radii, spacing, typography } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";

interface ButtonProps {
  /** A verb that says what happens, e.g. "Sign in" (not "OK"). */
  label: string;
  onPress: () => void;
  /** One primary button per screen; secondary actions are outlined. */
  variant?: "primary" | "secondary";
  /** Shows a spinner and ignores presses while an action is running. */
  loading?: boolean;
  disabled?: boolean;
}

/** A full-width button that's easy to hit and tells screen readers when it's busy. */
export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
}: ButtonProps) {
  const { colors } = useTheme();
  const isPrimary = variant === "primary";
  const textColor = isPrimary ? colors.onPrimary : colors.primary;

  return (
    <Pressable
      role="button"
      aria-label={label}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isPrimary
          ? { backgroundColor: colors.primary }
          : {
              borderColor: colors.borderStrong,
              borderWidth: 1,
              backgroundColor: colors.surface,
            },
        (pressed || disabled) && styles.dimmed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[typography.body, styles.label, { color: textColor }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radii.control,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontWeight: "600" },
  dimmed: { opacity: 0.7 },
});
