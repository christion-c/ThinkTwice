import { StyleSheet } from "react-native";

import { radii, spacing, type ThemeColors } from "../theme";

/** Style set shared by login.tsx, register.tsx, and forgotPassword.tsx's card/field/button layout. */
export const createAuthFormStyles = (colors: ThemeColors) =>
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

export type AuthFormStyles = ReturnType<typeof createAuthFormStyles>;
