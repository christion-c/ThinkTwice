import type { ReactNode } from "react";
import { useMemo, useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppPreferences, useThemeColors } from "./AppPreferences";
import { spacing, type ThemeColors } from "./theme";

export default function PageScaffold({
  title,
  subtitle,
  headerLeft,
  headerRight,
  children,
  footer,
  scrollable = true,
}: {
  title: string;
  subtitle?: string;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  scrollable?: boolean;
}) {
  const colors = useThemeColors();
  const { compactCards } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors, compactCards), [colors, compactCards]);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = ({ nativeEvent }: { nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } } }) => {
    const maxOffset = Math.max(nativeEvent.contentSize.height - nativeEvent.layoutMeasurement.height, 0);
    if (nativeEvent.contentOffset.y > maxOffset) {
      scrollRef.current?.scrollTo({
        y: maxOffset,
        animated: false,
      });
    }
  };

  const body = (
    <View style={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleWrap}>
            {headerLeft ? <View style={styles.headerLeft}>{headerLeft}</View> : null}
            <Text style={styles.title}>{title}</Text>
          </View>
          {headerRight ? <View style={styles.headerRight}>{headerRight}</View> : null}
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.heroGlow} pointerEvents="none" />
      {scrollable ? (
        <ScrollView
          ref={scrollRef}
          style={[styles.scroll, { overscrollBehavior: "none" } as any]}
          contentContainerStyle={[styles.scrollContent, { overscrollBehavior: "none" } as any]}
          showsVerticalScrollIndicator={false}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
          scrollEventThrottle={16}
          onScroll={handleScroll}
        >
          {body}
        </ScrollView>
      ) : (
        body
      )}
      {footer}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, compactCards: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    heroGlow: {
      position: "absolute",
      top: -40,
      right: -20,
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: "rgba(45, 212, 191, 0.12)",
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: compactCards ? spacing.lg : spacing.xl,
    },
    content: {
      paddingHorizontal: compactCards ? spacing.md : spacing.lg,
      paddingTop: compactCards ? spacing.md : spacing.lg,
      gap: compactCards ? spacing.md : spacing.lg,
    },
    header: {
      gap: compactCards ? 6 : 8,
    },
    headerTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    headerTitleWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      flex: 1,
    },
    headerLeft: {
      alignItems: "flex-start",
      justifyContent: "center",
    },
    headerRight: {
      alignItems: "flex-end",
      justifyContent: "center",
    },
    title: {
      fontSize: compactCards ? 28 : 32,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: 0.2,
      flexShrink: 1,
    },
    subtitle: {
      fontSize: compactCards ? 15 : 16,
      color: colors.textMuted,
      lineHeight: compactCards ? 22 : 24,
    },
  });