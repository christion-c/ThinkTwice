import { useEffect, useState } from "react";
import { Platform } from "react-native";

// React Native's KeyboardAvoidingView has nothing to avoid on web -
// there's no native keyboard-frame API in a browser, so it's
// effectively a no-op there. Mobile Safari instead shrinks
// window.visualViewport (not the layout viewport) when the on-screen
// keyboard opens, which is the only signal available for this. This
// tracks that shrink so a bottom-anchored modal (justifyContent:
// "flex-end") can pad itself out from under the keyboard instead of
// rendering underneath it - worst on a landscape iPad, where the
// keyboard covers a much larger share of the short viewport.
//
// Returns 0 on native platforms and in browsers without
// window.visualViewport support, where KeyboardAvoidingView already
// handles this (or there's nothing to do).
export function useWebKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    // Nothing to do on native, or in a browser without visualViewport support.
    if (Platform.OS !== "web" || typeof window === "undefined" || !window.visualViewport) {
      return;
    }

    const viewport = window.visualViewport;

    // Recomputes how much the keyboard has shrunk the visible viewport.
    const updateInset = () => {
      const shrink = window.innerHeight - viewport.height - viewport.offsetTop;
      setInset(shrink > 0 ? Math.round(shrink) : 0);
    };

    // Run once immediately, then keep tracking as the viewport changes.
    updateInset();
    viewport.addEventListener("resize", updateInset);
    viewport.addEventListener("scroll", updateInset);

    return () => {
      viewport.removeEventListener("resize", updateInset);
      viewport.removeEventListener("scroll", updateInset);
    };
  }, []);

  return inset;
}
