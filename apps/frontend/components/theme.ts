import { StyleSheet } from "react-native";

export type ColorMode = "dark" | "light";

export const palettes = {
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
} as const;

export type ThemeColors = (typeof palettes)[ColorMode];

export const getColors = (mode: ColorMode): ThemeColors => palettes[mode];

export const colors = palettes.dark;

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
