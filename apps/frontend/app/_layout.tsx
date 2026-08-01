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