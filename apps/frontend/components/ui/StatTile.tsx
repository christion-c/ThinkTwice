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
  // Some call sites lead with the value and caption it below (e.g. "3/4"
  // over "active habits") rather than labeling above the value - same
  // tile concept, reversed reading order.
  valueFirst?: boolean;
}

export default function StatTile({
  label,
  value,
  className = "",
  labelClassName = "",
  valueClassName = "",
  style,
  valueFirst = false,
}: StatTileProps) {
  const labelText = <Text className={labelClassName}>{label}</Text>;
  const valueText = <Text className={valueClassName}>{value}</Text>;

  return (
    <View style={style} className={className}>
      {valueFirst ? valueText : labelText}
      {valueFirst ? labelText : valueText}
    </View>
  );
}
