import { Pressable, Text } from "react-native";

interface AuthSubmitButtonProps {
  onPress: () => void;
  isSubmitting: boolean;
  idleLabel: string;
  submittingLabel: string;
  disabled?: boolean;
}

// The primary submit button shared by every auth form (sign in, sign up, reset).
export default function AuthSubmitButton({
  onPress,
  isSubmitting,
  idleLabel,
  submittingLabel,
  disabled = false,
}: AuthSubmitButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={isSubmitting || disabled}
      className="items-center rounded-md bg-accent py-3 active:opacity-85 disabled:opacity-85"
    >
      <Text className="text-base font-bold text-accentDeep">{isSubmitting ? submittingLabel : idleLabel}</Text>
    </Pressable>
  );
}
