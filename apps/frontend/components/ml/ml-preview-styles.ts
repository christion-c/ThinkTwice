import { StyleSheet } from "react-native";

import { radii, spacing, type ThemeColors } from "../theme";

/**
 * Style set shared by app/ml-preview.tsx and app/debug/ml-account.tsx -
 * both render the same card/form/metric-grid/feedback-box layout around
 * the same ML preview data, just with different copy and a couple of
 * page-specific extras (each page appends its own StyleSheet.create call
 * for anything not listed here).
 */
export const createMlPreviewStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.lg,
      gap: spacing.md,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
    },
    smallTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
    },
    text: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    formRow: {
      gap: spacing.sm,
    },
    inputGroup: {
      gap: 4,
    },
    label: {
      color: colors.text,
      fontSize: 12,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      color: colors.text,
      backgroundColor: colors.background,
    },
    primaryButton: {
      alignSelf: "flex-start",
      backgroundColor: colors.accent,
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    buttonPressed: {
      opacity: 0.8,
    },
    primaryButtonLabel: {
      color: colors.surface,
      fontSize: 14,
      fontWeight: "600",
    },
    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    error: {
      color: colors.danger,
      fontSize: 14,
    },
    metricRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    metricBox: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      padding: spacing.sm,
      gap: 4,
    },
    metricLabel: {
      color: colors.textMuted,
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    metricValue: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "700",
    },
    userInfoBox: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      padding: spacing.sm,
      backgroundColor: colors.background,
      gap: 4,
    },
    userInfoLabel: {
      color: colors.textMuted,
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    userInfoValue: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "600",
    },
    userInfoHint: {
      color: colors.textMuted,
      fontSize: 13,
    },
    feedbackBox: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      padding: spacing.sm,
      backgroundColor: colors.background,
    },
    feedbackLabel: {
      color: colors.textMuted,
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 4,
    },
    feedbackText: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
    },
  });

export type MlPreviewStyles = ReturnType<typeof createMlPreviewStyles>;
