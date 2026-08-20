import PrimaryButton from "../ui/PrimaryButton";

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
    <PrimaryButton
      onPress={onPress}
      disabled={isSubmitting || disabled}
      label={isSubmitting ? submittingLabel : idleLabel}
      className="active:opacity-85 disabled:opacity-85"
      textClassName="text-base"
    />
  );
}
