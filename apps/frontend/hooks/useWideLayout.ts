import { useWindowDimensions } from "react-native";

// Above this width (tablets, web, a phone in landscape) the dashboard
// tabs place cards side by side instead of stacking them, so the extra
// width holds content instead of stretching single cards edge to edge.
const WIDE_LAYOUT_MIN_WIDTH = 720;

export function useWideLayout(): boolean {
  const { width } = useWindowDimensions();
  return width >= WIDE_LAYOUT_MIN_WIDTH;
}
