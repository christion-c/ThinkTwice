import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { AuthProvider, useAuth } from "../src/features/auth/auth-provider";
import { useTheme } from "../src/theme/use-theme";

// Keep the splash screen up until we know whether someone is signed in, so the sign-in form never flashes.
void SplashScreen.preventAutoHideAsync();

/** Shows only the screens the current sign-in state allows. */
function RootNavigator() {
  const { state } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    if (state.status !== "loading") {
      void SplashScreen.hideAsync();
    }
  }, [state.status]);

  const isReady = state.status === "ready";
  const isSettingUp =
    state.status === "settingUp" || state.status === "setupFailed";
  const isSignedOut =
    state.status === "signedOut" || state.status === "loading";

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Protected guard={isReady}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={isSettingUp}>
          <Stack.Screen name="account-setup" />
        </Stack.Protected>
        <Stack.Protected guard={isSignedOut}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

/** The root of the app: sign-in state, then the navigator. */
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
