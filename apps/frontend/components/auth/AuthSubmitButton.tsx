import { Pressable, Text } from "react-native";

import type { AuthFormStyles } from "./auth-form-styles";

interface AuthSubmitButtonProps {
  onPress: () => void;
  isSubmitting: boolean;
  idleLabel: string;
  submittingLabel: string;
  disabled?: boolean;
  styles: AuthFormStyles;
}

/** The primary submit button shared by every auth form (sign in, sign up, reset). */
export default function AuthSubmitButton({
  onPress,
  isSubmitting,
  idleLabel,
  submittingLabel,
  disabled = false,
  styles,
}: AuthSubmitButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={isSubmitting || disabled}
      style={({ pressed }) => [styles.primaryButton, (pressed || isSubmitting) && styles.buttonPressed]}
    >
      <Text style={styles.primaryButtonLabel}>{isSubmitting ? submittingLabel : idleLabel}</Text>
    </Pressable>
  );
}
