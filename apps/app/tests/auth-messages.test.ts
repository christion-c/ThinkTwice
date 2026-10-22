import { FirebaseError } from "firebase/app";

import { authErrorMessage } from "../src/features/auth/auth-errors";
import {
  validateEmail,
  validateNewPassword,
  validatePassword,
} from "../src/features/auth/validation";

const JUDGMENT_WORDS =
  /\b(bad|wasted|failed|guilty|should have|invalid|error)\b/i;

describe("authErrorMessage", () => {
  it.each([
    "auth/invalid-credential",
    "auth/wrong-password",
    "auth/user-not-found",
    "auth/email-already-in-use",
    "auth/too-many-requests",
    "auth/network-request-failed",
  ])("gives a friendly, jargon-free message for %s", (code) => {
    const message = authErrorMessage(
      new FirebaseError(code, "technical details"),
    );
    expect(message).not.toContain("auth/");
    expect(message).not.toContain("technical details");
    expect(message).not.toMatch(JUDGMENT_WORDS);
  });

  it("never reveals whether an email has an account when signing in", () => {
    const wrongPassword = authErrorMessage(
      new FirebaseError("auth/wrong-password", ""),
    );
    const noAccount = authErrorMessage(
      new FirebaseError("auth/user-not-found", ""),
    );
    expect(noAccount).toBe(wrongPassword);
  });

  it("falls back to a generic message for anything unexpected", () => {
    expect(authErrorMessage(new Error("boom"))).toBe(
      "Something went wrong. Please try again.",
    );
    expect(authErrorMessage(new FirebaseError("auth/brand-new-code", ""))).toBe(
      "Something went wrong. Please try again.",
    );
  });
});

describe("validation", () => {
  it("requires a well-formed email", () => {
    expect(validateEmail("")).toBe("Enter your email address.");
    expect(validateEmail("not-an-email")).toBeDefined();
    expect(validateEmail("  alex@example.com  ")).toBeUndefined();
  });

  it("requires a password to sign in, of any length", () => {
    expect(validatePassword("")).toBe("Enter your password.");
    expect(validatePassword("abc")).toBeUndefined();
  });

  it("requires new passwords to have at least 8 characters", () => {
    expect(validateNewPassword("1234567")).toBeDefined();
    expect(validateNewPassword("12345678")).toBeUndefined();
  });
});
