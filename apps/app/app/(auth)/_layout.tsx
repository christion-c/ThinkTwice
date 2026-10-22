import { Stack } from "expo-router";

/** The sign-in screens, shown only while signed out. */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
