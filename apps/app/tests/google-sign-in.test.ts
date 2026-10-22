import { signInWithCredential } from "firebase/auth";

import { authErrorMessage } from "../src/features/auth/auth-errors";
import { signInWithGoogle } from "../src/features/auth/google-sign-in";
import { getConfig } from "../src/lib/config";

// Standalone mocks (named mock*, so jest.mock may use them) instead of methods read off mocked objects.
const mockSignInAsync = jest.fn<Promise<string>, [string]>();
const mockGoogleCredential = jest.fn((idToken: string) => ({ idToken }));

jest.mock("../modules/google-sign-in", () => ({
  GoogleSignInErrorCode: {
    cancelled: "ERR_GOOGLE_SIGN_IN_CANCELLED",
    noAccount: "ERR_GOOGLE_NO_ACCOUNT",
    failed: "ERR_GOOGLE_SIGN_IN_FAILED",
  },
  GoogleSignIn: {
    signInAsync: (webClientId: string) => mockSignInAsync(webClientId),
    signOutAsync: () => Promise.resolve(),
  },
}));
jest.mock("../src/lib/config", () => ({ getConfig: jest.fn() }));
jest.mock("../src/lib/firebase", () => ({ getFirebaseAuth: () => "auth" }));
jest.mock("firebase/auth", () => ({
  GoogleAuthProvider: {
    credential: (idToken: string) => mockGoogleCredential(idToken),
  },
  signInWithCredential: jest.fn(() => Promise.resolve()),
}));

/** Builds the error the native module rejects with for a given code. */
function nativeError(code: string): Error {
  return Object.assign(new Error("native detail"), { code });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getConfig).mockReturnValue({
    apiUrl: "http://api.test",
    firebase: { apiKey: "k", authDomain: "d", projectId: "p", appId: "a" },
    googleWebClientId: "web-client-id.apps.googleusercontent.com",
  });
});

describe("signInWithGoogle on Android", () => {
  it("signs in to Firebase with the Google ID token from the account picker", async () => {
    mockSignInAsync.mockResolvedValue("google-id-token");
    await expect(signInWithGoogle()).resolves.toBe("signedIn");
    expect(mockSignInAsync).toHaveBeenCalledWith(
      "web-client-id.apps.googleusercontent.com",
    );
    expect(mockGoogleCredential).toHaveBeenCalledWith("google-id-token");
    expect(signInWithCredential).toHaveBeenCalledWith("auth", {
      idToken: "google-id-token",
    });
  });

  it("treats closing the picker as a quiet cancel, not an error", async () => {
    mockSignInAsync.mockRejectedValue(
      nativeError("ERR_GOOGLE_SIGN_IN_CANCELLED"),
    );
    await expect(signInWithGoogle()).resolves.toBe("cancelled");
    expect(signInWithCredential).not.toHaveBeenCalled();
  });

  it("explains what to do when the device has no Google account", async () => {
    mockSignInAsync.mockRejectedValue(nativeError("ERR_GOOGLE_NO_ACCOUNT"));
    const error = await signInWithGoogle().catch(
      (rejection: unknown) => rejection,
    );
    expect(authErrorMessage(error)).toBe(
      "Add a Google account to this device first, then try again.",
    );
  });

  it("gives a friendly message, without native details, when Google sign-in fails", async () => {
    mockSignInAsync.mockRejectedValue(nativeError("ERR_GOOGLE_SIGN_IN_FAILED"));
    const error = await signInWithGoogle().catch(
      (rejection: unknown) => rejection,
    );
    expect(authErrorMessage(error)).toBe(
      "Google sign-in didn't work. Please try again.",
    );
    expect(authErrorMessage(error)).not.toContain("native detail");
  });

  it("says Google sign-in isn't available yet when the client ID isn't configured", async () => {
    jest.mocked(getConfig).mockReturnValue({
      apiUrl: "http://api.test",
      firebase: { apiKey: "k", authDomain: "d", projectId: "p", appId: "a" },
    });
    const error = await signInWithGoogle().catch(
      (rejection: unknown) => rejection,
    );
    expect(authErrorMessage(error)).toMatch(/isn't available in this version/);
    expect(mockSignInAsync).not.toHaveBeenCalled();
  });
});
