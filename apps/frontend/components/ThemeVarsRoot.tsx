import type { ReactNode } from "react";
import { useMemo } from "react";
import { View } from "react-native";
import { vars } from "nativewind";

import { useAppPreferences } from "./AppPreferences";
import { getColors } from "./theme";

// Bridges the app's runtime theme (colorMode x highContrast, four
// palettes total - see theme.ts's getColors()) into Tailwind/NativeWind
// as CSS custom properties, so className="bg-surface" etc. resolve to
// the same values useThemeColors() already returns. NativeWind's
// vars() is the documented way to do dynamic, non-binary theming
// (Tailwind's own dark: variant only covers a single light/dark axis,
// not this app's second high-contrast axis) - it sets CSS variables on
// this View that every descendant can read and that update reactively
// when the palette changes.
export default function ThemeVarsRoot({ children }: { children: ReactNode }) {
  const { colorMode, highContrast } = useAppPreferences();

  // Recompute the CSS vars only when the theme selection actually changes.
  const themeVars = useMemo(() => {
    const colors = getColors(colorMode, highContrast);

    return vars({
      "--color-background": colors.background,
      "--color-surface": colors.surface,
      "--color-surface-soft": colors.surfaceSoft,
      "--color-border": colors.border,
      "--color-text": colors.text,
      "--color-text-muted": colors.textMuted,
      "--color-accent": colors.accent,
      "--color-accent-deep": colors.accentDeep,
      "--color-success": colors.success,
      "--color-danger": colors.danger,
    });
  }, [colorMode, highContrast]);

  return <View style={[{ flex: 1 }, themeVars]}>{children}</View>;
}
