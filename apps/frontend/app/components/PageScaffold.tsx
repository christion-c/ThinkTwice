import type { ReactNode } from "react";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useThemeColors } from "./AppPreferences";
import { spacing, type ThemeColors } from "./theme";

export default function PageScaffold({
  title,
  subtitle,
  headerRight,
  children,
  footer,
  scrollable = true,
}: {
  title: string;
  subtitle?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  scrollable?: boolean;
}) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const body = (
    <View style={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.title}>{title}</Text>
          {headerRight ? <View style={styles.headerRight}>{headerRight}</View> : null}
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {scrollable ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: spacing.xl,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      gap: spacing.lg,
    },
    header: {
      gap: 8,
    },
    headerTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    headerRight: {
      alignItems: "flex-end",
      justifyContent: "center",
    },
    title: {
      fontSize: 32,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: 0.2,
      flexShrink: 1,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textMuted,
      lineHeight: 24,
    },
  });