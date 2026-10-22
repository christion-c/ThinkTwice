import { render } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

/** A phone-sized screen with a notch, so layouts get realistic safe-area insets in tests. */
const TEST_SAFE_AREA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

/** Renders a screen inside the providers the real app supplies (Expo Router adds them at the root). */
export async function renderScreen(screen: ReactElement) {
  return render(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA}>
      {screen}
    </SafeAreaProvider>,
  );
}
