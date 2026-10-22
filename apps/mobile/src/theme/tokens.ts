// Layout and type tokens from docs/design-guide.md.
import type { TextStyle } from "react-native";

/** The only spacing values to use. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
} as const;

export const radii = {
  card: 16,
  control: 12,
  round: 999,
} as const;

/** Widest the content column gets on large screens, so text never stretches edge to edge. */
export const contentMaxWidth = {
  form: 640,
  dashboard: 960,
} as const;

/** Phones get 16 points of side padding; tablets and desktops get 24. */
export const WIDE_SCREEN_MIN_WIDTH = 600;

/** Smallest size for anything tappable (iOS uses 44 points; Android and the web use 48). */
export const MIN_TOUCH_TARGET = 48;

/** Text styles in the system font. Body text is never smaller than 16. */
export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: "700" },
  title: { fontSize: 24, lineHeight: 32, fontWeight: "600" },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: "600" },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400" },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: "400" },
} as const satisfies Record<string, TextStyle>;
