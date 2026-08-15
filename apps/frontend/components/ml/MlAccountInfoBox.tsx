import { Text, View } from "react-native";

import type { MlPreviewStyles } from "./ml-preview-styles";

interface MlAccountInfoBoxProps {
  label: string;
  userId: string;
  historyCount: number;
  styles: MlPreviewStyles;
}

/** Shows which account a preview's data belongs to, and its history size. */
export default function MlAccountInfoBox({ label, userId, historyCount, styles }: MlAccountInfoBoxProps) {
  return (
    <View style={styles.userInfoBox}>
      <Text style={styles.userInfoLabel}>{label}</Text>
      <Text style={styles.userInfoValue}>{userId}</Text>
      <Text style={styles.userInfoHint}>History: {historyCount} entries</Text>
    </View>
  );
}
