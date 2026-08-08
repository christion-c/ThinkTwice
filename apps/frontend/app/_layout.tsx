import { Stack } from "expo-router";

import { AppPreferencesProvider, useThemeColors } from "./components/AppPreferences";

export default function RootLayout() {
    return (
        <AppPreferencesProvider>
            <AppStack />
        </AppPreferencesProvider>
    );
}

function AppStack() {
    const colors = useThemeColors();

    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
                headerTitleStyle: { fontWeight: "600" },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: colors.background },
            }}
        >
            <Stack.Screen name="index" options={{ title: "Home" }} />

            <Stack.Screen name="fuel" options={{ title: "Fuel" }} />
            <Stack.Screen name="nutrition" options={{ title: "Nutrition" }} />

            <Stack.Screen name="profile/profile" options={{ title: "Profile" }} />

            <Stack.Screen name="auth/login" options={{ title: "Login" }} />
            <Stack.Screen name="auth/register" options={{ title: "Register" }} />
            <Stack.Screen name="auth/forgotPassword" options={{ title: "Forgot Password" }} />

            <Stack.Screen name="settings/accessibility" options={{ title: "Accessibility" }} />
            <Stack.Screen name="settings/account" options={{ title: "Account" }} />
            <Stack.Screen name="settings/notifications" options={{ title: "Notifications" }} />
            <Stack.Screen name="settings/preferences" options={{ title: "Profile Settings" }} />
        </Stack>
    );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    balanceCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
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
    balanceRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    metricBlock: {
      flex: 1,
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
      fontSize: 18,
      fontWeight: "600",
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
    inputRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    inputBlock: {
      flex: 1,
      gap: 6,
    },
    inputLabel: {
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
  });
