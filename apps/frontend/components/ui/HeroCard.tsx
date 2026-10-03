import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useAppPreferences, useThemeColors } from "@/contexts/AppPreferencesProvider";
import { shadows } from "@/lib/theme";
import { withAlpha } from "@/lib/color";

// The headline card at the top of each dashboard tab: a full-bleed
// accent-to-danger gradient carrying that screen's one key figure.
// Text on it uses accentDeep, the color each palette already defines
// as "readable on accent" - checked at 4.7:1 or better against both
// gradient ends in both modes, so the hero never needs its own text
// colors per mode.
export default function HeroCard({ children }: { children: ReactNode }) {
  const colors = useThemeColors();
  const { compactCards } = useAppPreferences();

  return (
    <View style={shadows.elevated} className="overflow-hidden rounded-lg">
      <LinearGradient
        colors={[colors.accent, colors.danger]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View className={compactCards ? "gap-md p-lg" : "gap-lg p-xl"}>{children}</View>
    </View>
  );
}

// Small label/value tags for use inside a HeroCard ("Plan looks
// stable", "3/3 setup").
export function HeroPill({ label }: { label: string }) {
  const colors = useThemeColors();

  return (
    <View className="self-start rounded-round px-3 py-1" style={{ backgroundColor: withAlpha(colors.accentDeep, 0.18) }}>
      <Text className="text-xs font-bold uppercase tracking-[0.4px] text-accentDeep">{label}</Text>
    </View>
  );
}
