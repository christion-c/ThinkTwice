import { Text, View } from "react-native";

import { useThemeColors } from "@/components/contexts/AppPreferencesProvider";
import type { ChartPoint } from "@/lib/chart-series";
import { withAlpha } from "@/lib/color";

interface BarChartProps {
  data: ChartPoint[];
  color: string;
  // Height of the bar area, excluding the value and axis labels.
  height?: number;
  formatValue?: (value: number) => string;
}

// A vertical bar chart built from plain flexbox Views rather than SVG:
// each bar is an equal-width flex-1 column whose fill height is a
// percentage of its track, so the chart always stretches to whatever
// width its card has. Highlighted points (today, the latest fill-up)
// get the full color; the rest a softer tint, so the eye lands on
// "now" first.
export default function BarChart({ data, color, height = 120, formatValue = (value) => String(Math.round(value)) }: BarChartProps) {
  const colors = useThemeColors();
  const max = Math.max(...data.map((point) => point.value), 0);

  return (
    <View className="gap-xs">
      <View className="flex-row items-end gap-sm" style={{ height: height + 18 }}>
        {data.map((point, index) => {
          const fillPercent = max > 0 ? (point.value / max) * 100 : 0;
          return (
            <View key={`${point.label}-${index}`} className="flex-1 items-center gap-xs" style={{ height: height + 18 }}>
              <Text numberOfLines={1} className="h-[14px] text-[11px] font-bold text-textMuted">
                {point.value > 0 ? formatValue(point.value) : ""}
              </Text>
              <View
                className="w-full flex-1 justify-end overflow-hidden rounded-sm"
                style={{ backgroundColor: colors.surfaceSoft }}
              >
                <View
                  className="w-full rounded-sm"
                  style={{
                    height: `${fillPercent}%`,
                    minHeight: point.value > 0 ? 4 : 0,
                    backgroundColor: point.highlight ? color : withAlpha(color, 0.55),
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>
      <View className="flex-row gap-sm">
        {data.map((point, index) => (
          <Text
            key={`${point.label}-${index}`}
            numberOfLines={1}
            className={`flex-1 text-center text-[11px] ${point.highlight ? "font-bold text-text" : "text-textMuted"}`}
          >
            {point.label}
          </Text>
        ))}
      </View>
    </View>
  );
}
