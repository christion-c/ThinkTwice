import { StyleSheet } from "react-native";

import { radii, spacing, type ThemeColors } from "../theme";

export const createFuelStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    cardTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
    },
    cardText: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 22,
    },
    quickRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    quickCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      padding: spacing.md,
      gap: spacing.xs,
    },
    quickLabel: {
      color: colors.textMuted,
      fontSize: 13,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    quickValue: {
      color: colors.text,
      fontSize: 28,
      fontWeight: "700",
    },
    inputCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.md,
      gap: spacing.sm,
    },
    inputTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
    },
    inputSubtitle: {
      color: colors.textMuted,
      fontSize: 14,
    },
    syncHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.sm,
    },
    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    vehicleSelectorWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    vehicleChip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 6,
      paddingHorizontal: spacing.sm,
      backgroundColor: colors.surfaceSoft,
    },
    vehicleChipActive: {
      borderColor: colors.accent,
      backgroundColor: "rgba(45, 212, 191, 0.18)",
    },
    vehicleChipLabel: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: "600",
    },
    vehicleChipLabelActive: {
      color: colors.accent,
    },
    fieldList: {
      gap: spacing.sm,
    },
    inlineFieldRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    inlineFieldWrap: {
      flex: 1,
      gap: 6,
    },
    inlineFieldLabel: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: "600",
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.sm,
      backgroundColor: colors.surfaceSoft,
      color: colors.text,
      paddingHorizontal: spacing.sm,
      paddingVertical: 10,
      fontSize: 16,
    },
    modalBackdrop: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(4, 8, 12, 0.68)",
    },
    modalContainer: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.lg,
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    modalTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
    },
    modalHint: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      backgroundColor: colors.surfaceSoft,
      color: colors.text,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      fontSize: 16,
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    modalSecondaryButton: {
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
    },
    modalSecondaryLabel: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "600",
    },
    modalPrimaryButton: {
      borderRadius: radii.md,
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
    },
    modalPrimaryLabel: {
      color: colors.accentDeep,
      fontSize: 14,
      fontWeight: "700",
    },
    secondaryButton: {
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSoft,
      paddingVertical: 8,
      paddingHorizontal: spacing.sm,
    },
    secondaryButtonLabel: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "600",
    },
    primaryButton: {
      borderRadius: radii.md,
      backgroundColor: colors.accent,
      paddingVertical: 12,
      alignItems: "center",
    },
    primaryButtonLabel: {
      color: colors.accentDeep,
      fontSize: 15,
      fontWeight: "700",
    },
    errorText: {
      color: colors.danger,
      fontSize: 14,
    },
    successText: {
      color: colors.success,
      fontSize: 14,
    },
    buttonPressed: {
      opacity: 0.85,
    },
  });
