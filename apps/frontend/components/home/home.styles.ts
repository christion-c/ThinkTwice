import { StyleSheet } from "react-native";

import { radii, spacing, type ThemeColors } from "../theme";

export const createHomeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    brandLogo: {
      width: 64,
      height: 64,
    },
    balanceCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    statusPill: {
      alignSelf: "flex-start",
      backgroundColor: "rgba(45, 212, 191, 0.18)",
      borderRadius: radii.round,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    statusPillLabel: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    balanceLabel: {
      color: colors.textMuted,
      fontSize: 15,
    },
    balance: {
      color: colors.text,
      fontSize: 38,
      fontWeight: "700",
      marginTop: spacing.xs,
    },
    budgetStatusText: {
      fontSize: 14,
      fontWeight: "700",
    },
    balanceRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.sm,
      flexWrap: "wrap",
    },
    metricBlock: {
      minWidth: "30%",
      flexGrow: 1,
      backgroundColor: colors.surfaceSoft,
      borderRadius: radii.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    smallLabel: {
      color: colors.textMuted,
      marginBottom: 4,
    },
    income: {
      color: colors.success,
      fontSize: 18,
      fontWeight: "600",
    },
    expense: {
      color: colors.danger,
      fontSize: 16,
      fontWeight: "600",
    },
    neutral: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
    },
    fillUpCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.md,
      gap: spacing.sm,
    },
    fillUpLabel: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "700",
    },
    fillUpValue: {
      color: colors.accent,
      fontSize: 22,
      fontWeight: "700",
    },
    fillUpMeta: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    fillUpStatus: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    alertCard: {
      borderRadius: radii.lg,
      borderWidth: 1,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.xs,
    },
    alertTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "700",
    },
    alertText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 21,
    },
    alertMeta: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "600",
    },
    sectionCard: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.sm,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "700",
    },
    checklistWrap: {
      gap: spacing.xs,
    },
    checklistRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.surfaceSoft,
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
    },
    checklistLabel: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      fontWeight: "600",
    },
    quickActionsRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    summaryCard: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.xs,
    },
    summaryTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "700",
    },
    summaryText: {
      color: colors.textMuted,
      lineHeight: 21,
      fontSize: 14,
    },
    summaryHint: {
      color: colors.accent,
      lineHeight: 21,
      fontSize: 14,
      fontWeight: "600",
    },
  });

export const quickActionStyles = {
  card: (colors: ThemeColors) => ({
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.xs,
  }),
  pressed: {
    opacity: 0.85,
  },
  title: (colors: ThemeColors) => ({
    color: colors.text,
    fontSize: 16,
    fontWeight: "700" as const,
  }),
  description: (colors: ThemeColors) => ({
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  }),
};
