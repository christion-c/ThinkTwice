import { Stack } from "expo-router";

export default function RootLayout() {
    return (
        <Stack>

            <Stack.Screen name="index" options={{ title: "Home" }} />

            <Stack.Screen name="about" options={{ title: "About" }} />

            <Stack.Screen name="profile/profile" options={{ title: "Profile" }} />

            <Stack.Screen name="auth/login" options={{ title: "Login" }} />
            <Stack.Screen name="auth/register" options={{ title: "Register" }} />
            <Stack.Screen name="auth/forgot-password" options={{ title: "Forgot Password" }} />

            <Stack.Screen name="settings/accessibility" options={{ title: "Accessibility" }} />
            <Stack.Screen name="settings/account" options={{ title: "Account" }} />
            <Stack.Screen name="settings/notifications" options={{ title: "Notifications" }} />

 
        </Stack>
    );
}