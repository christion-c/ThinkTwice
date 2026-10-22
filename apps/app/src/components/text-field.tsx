import { useId, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { MIN_TOUCH_TARGET, radii, spacing, typography } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";

type TextFieldProps = Omit<TextInputProps, "style" | "placeholderTextColor"> & {
  label: string;
  /** Shown under the field and announced to screen readers. */
  error?: string | undefined;
};

/** A labeled text input with a visible focus outline and an accessible error message. */
export function TextField({
  label,
  error,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const errorId = useId();
  const borderColor = error === undefined ? colors.borderStrong : colors.error;

  return (
    <View style={styles.field}>
      <Text style={[typography.caption, styles.label, { color: colors.text }]}>
        {label}
      </Text>
      <TextInput
        {...inputProps}
        aria-label={label}
        aria-invalid={error !== undefined}
        aria-describedby={error === undefined ? undefined : errorId}
        placeholderTextColor={colors.textMuted}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          typography.body,
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: focused ? colors.primary : borderColor,
            borderWidth: focused ? 2 : 1,
          },
        ]}
      />
      {error === undefined ? null : (
        <Text
          nativeID={errorId}
          role="alert"
          style={[typography.caption, { color: colors.error }]}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { fontWeight: "600" },
  input: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radii.control,
    paddingHorizontal: spacing.md,
  },
});
