import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";

// Re-runs `refetch` whenever this screen becomes relevant again, not
// just on first mount. Context providers only fetch once when the app
// starts, so without this, a change made on another device (or another
// browser tab) never shows up here until a hard reload.
export function useRefetchOnFocus(refetch: () => void | Promise<void>): void {
  // Tracks whether THIS screen is currently the focused one, so the
  // AppState listener below only refetches for the screen actually on screen.
  const isScreenFocused = useRef(false);

  // Trigger 1: returning to this screen via in-app navigation.
  useFocusEffect(
    useCallback(() => {
      isScreenFocused.current = true;
      void refetch();

      return () => {
        isScreenFocused.current = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refetch]),
  );

  // Trigger 2: the app/tab becoming active again after being
  // backgrounded. On web this maps to document.visibilitychange via
  // react-native-web, so it also catches "left this tab open, switched
  // back to it" with no navigation involved - but only while this
  // screen is the focused one.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && isScreenFocused.current) {
        void refetch();
      }
    });

    return () => subscription.remove();
  }, [refetch]);
}
