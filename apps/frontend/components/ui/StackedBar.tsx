import { Text, View } from "react-native";

import { useThemeColors } from "@/contexts/AppPreferencesProvider";
import { percentOf } from "@/lib/fuel/chart-series";

export interface StackedBarSegment {
  label: string;
  value: number;
  color: string;
}

interface StackedBarProps {
  segments: StackedBarSegment[];
  formatValue: (value: number) => string;
  height?: number;
}

// A horizontal "where does it all go" bar: each segment is a flex
// child whose flex-grow is its value, so flexbox itself sizes the
// shares - no width math. A 2-column legend underneath gives each
// segment's amount and share of the total.
export default function StackedBar({ segments, formatValue, height = 16 }: StackedBarProps) {
  const colors = useThemeColors();
  const visible = segments.filter((segment) => segment.value > 0);
  const total = visible.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <View className="gap-lg">
      <View
        className="flex-row gap-0.5 overflow-hidden rounded-round"
        style={{ height, backgroundColor: colors.surfaceSoft }}
      >
        {visible.map((segment) => (
          <View key={segment.label} style={{ flex: segment.value, backgroundColor: segment.color }} />
        ))}
      </View>
      <ChartLegend segments={segments} total={total} formatValue={formatValue} />
    </View>
  );
}

// Legend rows for any part-of-a-whole chart (StackedBar, DonutGauge):
// color dot, label, amount and percent of the total, two per row.
export function ChartLegend({
  segments,
  total,
  formatValue,
  columns = 2,
}: {
  segments: StackedBarSegment[];
  total: number;
  formatValue: (value: number) => string;
  columns?: 1 | 2;
}) {
  return (
    <View className="flex-row flex-wrap gap-y-md">
      {segments.map((segment) => (
        <View
          key={segment.label}
          className="flex-row items-start gap-sm pr-sm"
          style={{ width: columns === 2 ? "50%" : "100%" }}
        >
          <View className="mt-1 h-2.5 w-2.5 rounded-round" style={{ backgroundColor: segment.color }} />
          <View className="flex-1">
            <Text numberOfLines={1} className="text-caption text-textMuted">
              {segment.label}
            </Text>
            <View className="flex-row items-baseline gap-xs">
              <Text numberOfLines={1} className="text-body font-bold text-text">
                {formatValue(segment.value)}
              </Text>
              <Text className="text-xs font-semibold" style={{ color: segment.color }}>
                {percentOf(Math.max(segment.value, 0), total)}%
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
