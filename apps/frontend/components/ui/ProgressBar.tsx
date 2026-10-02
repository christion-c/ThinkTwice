import { View } from "react-native";

interface ProgressBarProps {
  // 0-100, clamped.
  percent: number;
  color: string;
  trackColor: string;
  height?: number;
}

// A single-value horizontal progress bar (setup completion, share of
// income spent) - the linear counterpart to RadialGauge.
export default function ProgressBar({ percent, color, trackColor, height = 8 }: ProgressBarProps) {
  const clamped = Math.min(Math.max(percent, 0), 100);

  return (
    <View className="w-full overflow-hidden rounded-round" style={{ height, backgroundColor: trackColor }}>
      <View className="h-full rounded-round" style={{ width: `${clamped}%`, backgroundColor: color }} />
    </View>
  );
}
