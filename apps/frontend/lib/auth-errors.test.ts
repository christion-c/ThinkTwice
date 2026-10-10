import { getAuthErrorMessage, getGoogleSignInErrorMessage } from "./auth-errors";

describe("getAuthErrorMessage", () => {
  const cases: [string, string][] = [
    ["auth/invalid-email", "Please enter a valid email address."],
    ["auth/user-not-found", "Email or password is incorrect."],
    ["auth/wrong-password", "Email or password is incorrect."],
    ["auth/invalid-credential", "Email or password is incorrect."],
    ["auth/too-many-requests", "Too many attempts. Please try again later."],
    ["auth/email-already-in-use", "That email is already in use."],
    ["auth/weak-password", "Password is too weak. Use a stronger one."],
  ];

  it.each(cases)("maps %s to a specific user-facing message", (code, expected) => {
    expect(getAuthErrorMessage({ code }, "fallback")).toBe(expected);
  });

  it("falls back to the caller's default message for an unrecognized code", () => {
    expect(getAuthErrorMessage({ code: "auth/some-new-error" }, "fallback message")).toBe(
      "fallback message",
    );
  });

  it("falls back to the default message for a non-object error", () => {
    expect(getAuthErrorMessage("not an error object", "fallback")).toBe("fallback");
    expect(getAuthErrorMessage(null, "fallback")).toBe("fallback");
    expect(getAuthErrorMessage(undefined, "fallback")).toBe("fallback");
  });

  it("falls back to the default message for an object with no code field", () => {
    expect(getAuthErrorMessage({ message: "boom" }, "fallback")).toBe("fallback");
  });
});

describe("getGoogleSignInErrorMessage", () => {
  it("shows nothing for a sign-in that's already in progress", () => {
    expect(getGoogleSignInErrorMessage({ code: "ASYNC_OP_IN_PROGRESS" })).toBeNull();
  });

  it("explains a missing signing-key setup (DEVELOPER_ERROR) without blaming the user", () => {
    expect(getGoogleSignInErrorMessage({ code: "10" })).toMatch(/isn't set up for this version/);
  });

  it("handles missing Play services and an email already registered", () => {
    expect(getGoogleSignInErrorMessage({ code: "PLAY_SERVICES_NOT_AVAILABLE" })).toMatch(/Google Play services/);
    expect(getGoogleSignInErrorMessage({ code: "auth/account-exists-with-different-credential" })).toMatch(
      /already has a ThinkTwice account/,
    );
  });

  it("falls back to the shared Firebase messages, then a generic one", () => {
    expect(getGoogleSignInErrorMessage({ code: "auth/too-many-requests" })).toBe("Too many attempts. Please try again later.");
    expect(getGoogleSignInErrorMessage(new Error("boom"))).toBe("Unable to sign in with Google. Please try again.");
  });
});
