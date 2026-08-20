import { Pressable, Text } from "react-native";

// The filled accent-color button shared by check-in start actions and
// (via AuthSubmitButton) auth forms. `className`/`textClassName` are escape
// hatches so call sites that differ slightly from the baseline (press/
// disabled feedback, text size) can keep their exact existing look.
interface PrimaryButtonProps {
  onPress: () => void;
  label: string;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
}

export default function PrimaryButton({
  onPress,
  label,
  disabled = false,
  className = "",
  textClassName = "",
}: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`items-center rounded-md bg-accent py-3 ${className}`}
    >
      <Text className={`font-bold text-accentDeep ${textClassName}`}>{label}</Text>
    </Pressable>
  );
}
