import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Text, View } from "react-native";

import { withAlpha } from "@/lib/color";

interface KpiTileProps {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  tint: string;
  caption?: string;
  // Smallest share of the row this tile may shrink to before wrapping.
  // The 40% default puts two tiles per row on a phone inside a
  // flex-wrap container; pass ~28% for three across.
  minWidth?: `${number}%`;
}

// A color-tinted metric tile ("Income / $4,200") for the dashboard tile
// grids. Tiles grow (flex-1) to share their row evenly, so a grid of
// them always spans the full card width whatever the count.
export default function KpiTile({ icon, label, value, tint, caption, minWidth = "40%" }: KpiTileProps) {
  return (
    <View className="flex-1 gap-sm rounded-md p-lg" style={{ minWidth, backgroundColor: withAlpha(tint, 0.14) }}>
      <View className="flex-row items-center gap-sm">
        <View
          className="h-7 w-7 items-center justify-center rounded-round"
          style={{ backgroundColor: withAlpha(tint, 0.22) }}
        >
          <Ionicons name={icon} size={15} color={tint} />
        </View>
        <Text numberOfLines={1} className="flex-1 text-xs font-semibold uppercase tracking-[0.4px] text-textMuted">
          {label}
        </Text>
      </View>
      <Text numberOfLines={1} adjustsFontSizeToFit className="text-[22px] font-bold text-text">
        {value}
      </Text>
      {caption ? (
        <Text numberOfLines={1} className="text-xs font-semibold" style={{ color: tint }}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}
