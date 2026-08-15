import { Text, View } from "react-native";

import type { MlPreviewStyles } from "./ml-preview-styles";

interface MlMetricBoxProps {
  label: string;
  value: string;
  styles: MlPreviewStyles;
}

/** One label/value tile in a metric grid (e.g. "Projected fuel cost" / "$64.20"). */
export default function MlMetricBox({ label, value, styles }: MlMetricBoxProps) {
  return (
    <View style={styles.metricBox}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}
