import { StyleSheet } from "react-native";

export type ColorMode = "dark" | "light";

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSoft: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentDeep: string;
  success: string;
  danger: string;
}

export const palettes: Record<ColorMode, ThemeColors> = {
  dark: {
    background: "#0F172A",
    surface: "#16213A",
    surfaceSoft: "#1E2B4A",
    border: "rgba(255, 255, 255, 0.08)",
    text: "#F8FAFC",
    textMuted: "#9FB0C9",
    accent: "#2DD4BF",
    accentDeep: "#042F2E",
    success: "#34D399",
    danger: "#FB7185",
  },
  light: {
    background: "#F3F6FB",
    surface: "#FFFFFF",
    surfaceSoft: "#EEF3FF",
    border: "rgba(15, 23, 42, 0.12)",
    text: "#0F172A",
    textMuted: "#475569",
    accent: "#0EA5A4",
    accentDeep: "#0F172A",
    success: "#16A34A",
    danger: "#E11D48",
  },
};

/**
 * High contrast keeps each mode's accent/status colors (so the app still
 * looks like itself) but pushes background/text/border to their most
 * legible extremes, and thickens borders so card edges stay visible.
 */
const highContrastOverrides: Record<ColorMode, Partial<ThemeColors>> = {
  dark: {
    background: "#000000",
    surface: "#000000",
    surfaceSoft: "#111111",
    border: "rgba(255, 255, 255, 0.4)",
    text: "#FFFFFF",
    textMuted: "#E2E8F0",
  },
  light: {
    background: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceSoft: "#F1F5F9",
    border: "rgba(0, 0, 0, 0.5)",
    text: "#000000",
    textMuted: "#1F2937",
  },
};

export const getColors = (
  mode: ColorMode,
  highContrast = false,
): ThemeColors =>
  highContrast
    ? { ...palettes[mode], ...highContrastOverrides[mode] }
    : palettes[mode];

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  round: 999,
};

export const shadows = StyleSheet.create({
  elevated: {
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  soft: {
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
});
