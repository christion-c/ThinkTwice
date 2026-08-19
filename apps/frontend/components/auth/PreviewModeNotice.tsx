import { Text } from "react-native";

interface PreviewModeNoticeProps {
  visible: boolean;
  message: string;
}

/** The "Firebase not configured" banner shown by every auth form when running unconfigured. */
export default function PreviewModeNotice({ visible, message }: PreviewModeNoticeProps) {
  if (!visible) {
    return null;
  }

  return <Text className="text-sm leading-5 text-textMuted">{message}</Text>;
}
