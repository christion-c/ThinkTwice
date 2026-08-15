import { StyleSheet } from "react-native";

import { radii, spacing, type ThemeColors } from "./theme";

/** Style set for StepFlowModal, shared by every "one field at a time" check-in flow. */
export const createStepFlowStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
  });

export type StepFlowStyles = ReturnType<typeof createStepFlowStyles>;
