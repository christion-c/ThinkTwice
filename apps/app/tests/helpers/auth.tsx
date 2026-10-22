import type { ReactElement } from "react";

import {
  AuthContext,
  type AuthContextValue,
} from "../../src/features/auth/auth-provider";
import { renderScreen } from "./render";

/** Returns a signed-out auth context with mock actions, with any parts overridden. */
export function fakeAuth(
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue {
  return {
    state: { status: "signedOut" },
    signIn: jest.fn(() => Promise.resolve()),
    signUp: jest.fn(() => Promise.resolve()),
    signOut: jest.fn(() => Promise.resolve()),
    resetPassword: jest.fn(() => Promise.resolve()),
    retryAccountSetup: jest.fn(),
    ...overrides,
  };
}

/** Renders a screen with the given auth context instead of real Firebase. */
export async function renderWithAuth(
  screen: ReactElement,
  auth: AuthContextValue = fakeAuth(),
) {
  return renderScreen(<AuthContext value={auth}>{screen}</AuthContext>);
}
