import type { AuthState } from "./auth-provider";

/** The screen each sign-in state starts on; hidden screens redirect here. */
export function startRouteFor(
  status: AuthState["status"],
): "/" | "/account-setup" | "/sign-in" {
  switch (status) {
    case "ready":
      return "/";
    case "settingUp":
    case "setupFailed":
      return "/account-setup";
    case "loading":
    case "signedOut":
      return "/sign-in";
  }
}
