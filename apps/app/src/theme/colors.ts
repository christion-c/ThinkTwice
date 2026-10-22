// Color tokens from docs/design-guide.md. Components use these by name; never hard-code colors.
// tests/theme.test.ts checks every text and control color against WCAG 2.2 AA contrast in all four modes.

export type ColorScheme = "light" | "dark";

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSoft: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  success: string;
  error: string;
  essential: string;
  discretionary: string;
  chartBlue: string;
  chartBerry: string;
}

/** Text colors that must reach 4.5:1 against every background color. */
export const TEXT_COLOR_TOKENS = [
  "text",
  "textMuted",
  "primary",
  "success",
  "error",
  "essential",
  "discretionary",
  "chartBlue",
  "chartBerry",
] as const satisfies readonly (keyof ThemeColors)[];

/** Background colors that text and controls can appear on. */
export const BACKGROUND_COLOR_TOKENS = [
  "background",
  "surface",
  "surfaceSoft",
] as const satisfies readonly (keyof ThemeColors)[];

const palettes: Record<ColorScheme, ThemeColors> = {
  light: {
    background: "#FBF2E4",
    surface: "#FFFFFF",
    surfaceSoft: "#F6E9D3",
    border: "rgba(43, 27, 14, 0.12)",
    borderStrong: "#957B61",
    text: "#2B1B10",
    textMuted: "#7C6248",
    primary: "#AD4B09",
    onPrimary: "#FFF8EE",
    success: "#55731F",
    error: "#B23A1E",
    essential: "#0E7567",
    discretionary: "#896108",
    chartBlue: "#2E68AE",
    chartBerry: "#9A3D8E",
  },
  dark: {
    background: "#1B1410",
    surface: "#241B14",
    surfaceSoft: "#2E2318",
    border: "rgba(245, 230, 210, 0.10)",
    borderStrong: "#88725D",
    text: "#F1E4D4",
    textMuted: "#B49A80",
    primary: "#F0913D",
    onPrimary: "#241608",
    success: "#A9C15E",
    error: "#E2673F",
    essential: "#4FBFAE",
    discretionary: "#E9BC4F",
    chartBlue: "#74A9E0",
    chartBerry: "#D184C8",
  },
};

/** High contrast keeps every accent color but pushes neutrals to their extremes and strengthens borders. */
const highContrastOverrides: Record<ColorScheme, Partial<ThemeColors>> = {
  light: {
    background: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceSoft: "#F8EFDD",
    border: "rgba(43, 27, 14, 0.5)",
    text: "#000000",
    textMuted: "#2B1B10",
  },
  dark: {
    background: "#000000",
    surface: "#000000",
    surfaceSoft: "#1A130D",
    border: "rgba(245, 230, 210, 0.4)",
    text: "#FFFFFF",
    textMuted: "#F1E4D4",
  },
};

/** Returns the color tokens for a color scheme, optionally in high contrast. */
export function getColors(
  scheme: ColorScheme,
  highContrast = false,
): ThemeColors {
  return highContrast
    ? { ...palettes[scheme], ...highContrastOverrides[scheme] }
    : palettes[scheme];
}
