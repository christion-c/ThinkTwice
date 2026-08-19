import { Text, View } from "react-native";

interface MlMetricBoxProps {
  label: string;
  value: string;
}

// One label/value tile in a metric grid (e.g. "Projected fuel cost" / "$64.20").
export default function MlMetricBox({ label, value }: MlMetricBoxProps) {
  return (
    <View className="flex-1 gap-1 rounded-md border border-border p-sm">
      <Text className="text-xs uppercase tracking-[0.4px] text-textMuted">{label}</Text>
      <Text className="text-base font-bold text-text">{value}</Text>
    </View>
  );
}
