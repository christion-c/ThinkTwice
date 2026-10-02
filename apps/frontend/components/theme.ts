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
  // Chart/category hues for the card dashboards - extra colors beyond
  // the accent/success/danger trio so a chart with four series doesn't
  // have to reuse status colors (which would read as good/bad). Each
  // clears 4.5:1 against both this mode's background and surface, so
  // they're safe as text color too, not just fills.
  teal: string;
  blue: string;
  berry: string;
  gold: string;
}

// A fall/harvest palette: warm espresso-brown neutrals (not the plum
// this app used to lean on) under a pumpkin-orange accent, olive-gold
// success, and brick-red danger. Both modes share the same hue family
// for background/text/accent (just inverted lightness), so switching
// modes feels like the same app rather than two different color
// schemes - the plum-charcoal dark mode this replaced didn't share
// any hue with the warm cream/orange light mode, which read as
// mismatched. Every pairing below was checked against WCAG contrast
// ratios (see scratchpad/contrast*.py from the redesign this was
// picked in) and hits at least AA (4.5:1 body text, 3:1 large text).
export const palettes: Record<ColorMode, ThemeColors> = {
  dark: {
    // Warm near-black (espresso, not plum) - lifted slightly off true
    // black and text dialed down from near-white to a soft warm cream,
    // since pure white-on-black is the classic source of dark-mode eye
    // strain.
    background: "#1B1410",
    surface: "#241B14",
    surfaceSoft: "#2E2318",
    border: "rgba(245, 230, 210, 0.10)",
    text: "#F1E4D4",
    textMuted: "#B49A80",
    accent: "#F0913D",
    accentDeep: "#241608",
    success: "#A9C15E",
    danger: "#E2673F",
    teal: "#4FBFAE",
    blue: "#74A9E0",
    berry: "#D184C8",
    gold: "#E9BC4F",
  },
  light: {
    background: "#FBF2E4",
    surface: "#FFFFFF",
    surfaceSoft: "#F6E9D3",
    border: "rgba(43, 27, 14, 0.12)",
    text: "#2B1B10",
    textMuted: "#7C6248",
    accent: "#B8500A",
    // Unlike dark mode, the accent here is deep enough that dark text on
    // it reads worse than a warm off-white does (see contrast script) -
    // accentDeep is "whatever reads best on this mode's accent," not a
    // shared literal between modes.
    accentDeep: "#FFF8EE",
    success: "#55731F",
    danger: "#B23A1E",
    teal: "#0F7A6B",
    blue: "#2E68AE",
    berry: "#9A3D8E",
    gold: "#8F6508",
  },
};

// High contrast keeps each mode's accent/status colors (so the app
// still looks like itself) but pushes background/text/border to their
// most legible extremes, and thickens borders so card edges stay visible.
const highContrastOverrides: Record<ColorMode, Partial<ThemeColors>> = {
  dark: {
    background: "#000000",
    surface: "#000000",
    surfaceSoft: "#1A130D",
    border: "rgba(245, 230, 210, 0.4)",
    text: "#FFFFFF",
    textMuted: "#F1E4D4",
  },
  light: {
    background: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceSoft: "#F8EFDD",
    border: "rgba(43, 27, 14, 0.5)",
    text: "#000000",
    textMuted: "#2B1B10",
  },
};

export const getColors = (
  mode: ColorMode,
  highContrast = false,
): ThemeColors =>
  highContrast
    ? { ...palettes[mode], ...highContrastOverrides[mode] }
    : palettes[mode];

// Kept in sync with tailwind.config.js's spacing scale.
export const spacing = {
  xs: 3,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 28,
  xxxl: 40,
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
