import { StyleSheet } from "react-native";

import { radii, spacing, type ThemeColors } from "../theme";

/**
 * Shared by login, register, and forgotPassword — all three are single-card
 * auth forms with the same base look. Screens that don't need a given key
 * (e.g. only login uses the google* styles) simply never reference it.
 */
export const createAuthStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.lg,
      gap: spacing.md,
    },
    cardTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "700",
    },
    formGroup: {
      gap: 6,
    },
    label: {
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
      paddingVertical: 12,
      fontSize: 16,
    },
    errorText: {
      color: colors.danger,
      fontSize: 14,
    },
    successText: {
      color: colors.success,
      fontSize: 14,
    },
    previewText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    primaryButton: {
      borderRadius: radii.md,
      backgroundColor: colors.accent,
      paddingVertical: 12,
      alignItems: "center",
    },
    primaryButtonLabel: {
      color: colors.accentDeep,
      fontSize: 16,
      fontWeight: "700",
    },
    googleButton: {
      borderRadius: radii.md,
      borderWidth: 1,
      paddingVertical: 12,
      alignItems: "center",
    },
    googleButtonWhite: {
      backgroundColor: "#FFFFFF",
      borderColor: "#DADCE0",
    },
    googleButtonBlack: {
      backgroundColor: "#131314",
      borderColor: "#5F6368",
    },
    googleButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    googleButtonLabel: {
      fontSize: 16,
      fontWeight: "700",
    },
    googleButtonLabelWhite: {
      color: "#3C4043",
    },
    googleButtonLabelBlack: {
      color: "#FFFFFF",
    },
    buttonPressed: {
      opacity: 0.85,
    },
    signupRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      justifyContent: "center",
    },
    subtleText: {
      color: colors.textMuted,
      fontSize: 14,
    },
    linkText: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: "700",
      textAlign: "center",
    },
  });
