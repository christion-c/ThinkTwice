import { useColorScheme } from "react-native";

import { getColors, type ColorScheme, type ThemeColors } from "./colors";

export interface Theme {
  scheme: ColorScheme;
  colors: ThemeColors;
}

/** Returns the current theme, following the device's light or dark setting. */
export function useTheme(): Theme {
  const scheme: ColorScheme = useColorScheme() === "dark" ? "dark" : "light";
  return { scheme, colors: getColors(scheme) };
}
