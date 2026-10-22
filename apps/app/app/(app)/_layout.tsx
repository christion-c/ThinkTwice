import { Stack } from "expo-router";

/** The main app, shown only to signed-in users whose account is set up. */
export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
