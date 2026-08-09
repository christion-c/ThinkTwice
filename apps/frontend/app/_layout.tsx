import type { ReactNode } from "react";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";

import { AppPreferencesProvider, useThemeColors } from "./components/AppPreferences";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import { FinanceProvider } from "./components/FinanceContext";
import { VehicleProvider } from "./components/VehicleContext";

export default function RootLayout() {
  return (
    <AppPreferencesProvider>
      <AuthProvider>
        <VehicleProvider>
          <FinanceProvider>
            <AuthGate>
              <AppStack />
            </AuthGate>
          </FinanceProvider>
        </VehicleProvider>
      </AuthProvider>
    </AppPreferencesProvider>
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  const { user, initializing } = useAuth();
  const colors = useThemeColors();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (initializing) {
      return;
    }

    const inAuthFlow = segments[0] === "auth";

    if (!user && !inAuthFlow) {
      router.replace("/auth/login");
      return;
    }

    if (user && inAuthFlow) {
      router.replace("/");
    }
  }, [user, initializing, segments, router]);

  if (initializing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

function AppStack() {
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "600" },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Home" }} />

      <Stack.Screen name="fuel" options={{ title: "Fuel" }} />
      <Stack.Screen name="finance" options={{ title: "Finance" }} />

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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
