import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";

/**
 * Re-runs `refetch` whenever this screen becomes relevant again, not just
 * on first mount. Context providers only fetch once when the app starts,
 * so without this, a change made on another device (or another browser
 * tab) never shows up here until a hard reload.
 *
 * Two triggers:
 * - Returning to this screen via in-app navigation (useFocusEffect).
 * - The app/tab becoming active again after being backgrounded (AppState —
 *   on web this maps to document.visibilitychange via react-native-web,
 *   so it also catches "left this tab open, switched back to it" with no
 *   navigation involved), but only while this screen is the focused one.
 */
export function useRefetchOnFocus(refetch: () => void | Promise<void>): void {
  const isScreenFocused = useRef(false);

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

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && isScreenFocused.current) {
        void refetch();
      }
    });

    return () => subscription.remove();
  }, [refetch]);
}
