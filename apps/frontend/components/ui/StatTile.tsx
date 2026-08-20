import type { StyleProp, ViewStyle } from "react-native";
import { Text, View } from "react-native";

// A labeled stat tile ("Income" / "$4,200"), used anywhere the app shows a
// row of small metric boxes (home summary, finance snapshot, fuel gauges,
// ML preview metrics). Container/label/value styling is fully driven by
// className props rather than fixed variants, since existing call sites
// each have their own layout, padding, and emphasis that predate this
// component - this lets every site keep its exact current appearance.
interface StatTileProps {
  label: string;
  value: string;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  style?: StyleProp<ViewStyle>;
}

export default function StatTile({
  label,
  value,
  className = "",
  labelClassName = "",
  valueClassName = "",
  style,
}: StatTileProps) {
  return (
    <View style={style} className={className}>
      <Text className={labelClassName}>{label}</Text>
      <Text className={valueClassName}>{value}</Text>
    </View>
  );
}
