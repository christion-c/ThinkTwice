import type { ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  contentMaxWidth,
  spacing,
  WIDE_SCREEN_MIN_WIDTH,
} from "../theme/tokens";
import { useTheme } from "../theme/use-theme";

interface ScreenProps {
  children: ReactNode;
  /** "form" for forms and lists (640 wide at most), "dashboard" for the dashboard (960). */
  width?: keyof typeof contentMaxWidth;
}

/** Lays out a screen: themed background, safe areas, scrolling, and a centered column on wide screens. */
export function Screen({ children, width = "form" }: ScreenProps) {
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const sidePadding =
    windowWidth >= WIDE_SCREEN_MIN_WIDTH ? spacing.xl : spacing.lg;

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: sidePadding },
        ]}
      >
        <View style={[styles.column, { maxWidth: contentMaxWidth[width] }]}>
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  column: { width: "100%", flexGrow: 1 },
});
