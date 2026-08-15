import { Text } from "react-native";

import type { AuthFormStyles } from "./auth-form-styles";

interface PreviewModeNoticeProps {
  visible: boolean;
  message: string;
  styles: AuthFormStyles;
}

/** The "Firebase env vars are missing" banner shown by every auth form when running unconfigured. */
export default function PreviewModeNotice({ visible, message, styles }: PreviewModeNoticeProps) {
  if (!visible) {
    return null;
  }

  return <Text style={styles.previewText}>{message}</Text>;
}
