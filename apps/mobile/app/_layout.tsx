import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { useTheme } from "../src/theme/use-theme";

/** The root of the app: a themed stack of screens with headers hidden (each screen draws its own). */
export default function RootLayout() {
  const { colors } = useTheme();

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}
