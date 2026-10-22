// "Continue with Google", styled to Google's sign-in branding guidelines
// (https://developers.google.com/identity/branding-guidelines): the official G logo, Google's colors, Roboto Medium.
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

import googleLogo from "../../../assets/images/google-g.png";
import { MIN_TOUCH_TARGET, radii, spacing } from "../../theme/tokens";
import { useTheme } from "../../theme/use-theme";
import { authErrorMessage } from "./auth-errors";
import { signInWithGoogle } from "./google-sign-in";

/** Google's required button colors for light and dark backgrounds. */
const GOOGLE_COLORS = {
  light: { background: "#FFFFFF", border: "#747775", text: "#1F1F1F" },
  dark: { background: "#131314", border: "#8E918F", text: "#E3E3E3" },
} as const;

const LABEL = "Continue with Google";

interface GoogleSignInButtonProps {
  /** Called with a message that's safe to show when Google sign-in fails. */
  onError: (message: string) => void;
  /** Called when a new attempt starts, so the screen can clear an old message. */
  onStart?: () => void;
}

/** Signs in (or signs up) with Google; the app moves on by itself once signed in. */
export function GoogleSignInButton({
  onError,
  onStart,
}: GoogleSignInButtonProps) {
  const { scheme } = useTheme();
  const colors = GOOGLE_COLORS[scheme];
  const [busy, setBusy] = useState(false);

  // Runs Google sign-in, reporting failures but staying quiet if the user simply closed the picker.
  async function handlePress() {
    onStart?.();
    setBusy(true);
    try {
      const result = await signInWithGoogle();
      if (result === "cancelled") {
        setBusy(false);
      }
    } catch (error) {
      onError(authErrorMessage(error));
      setBusy(false);
    }
  }

  return (
    <Pressable
      role="button"
      aria-label={LABEL}
      aria-busy={busy}
      disabled={busy}
      onPress={() => void handlePress()}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.background, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <>
          <Image source={googleLogo} style={styles.logo} aria-hidden />
          <Text style={[styles.label, { color: colors.text }]}>{LABEL}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radii.control,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  logo: { width: 20, height: 20 },
  label: { fontSize: 16, lineHeight: 24, fontWeight: "500" },
  pressed: { opacity: 0.8 },
});
