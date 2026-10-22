import * as z from "zod";

/** New passwords must be at least this long. Existing passwords are never checked against it. */
export const MIN_NEW_PASSWORD_LENGTH = 8;

const emailSchema = z.email();

/** Returns a message if the email is missing or malformed, otherwise undefined. */
export function validateEmail(email: string): string | undefined {
  if (email.trim() === "") {
    return "Enter your email address.";
  }
  return emailSchema.safeParse(email.trim()).success
    ? undefined
    : "That doesn't look like an email address. Check it and try again.";
}

/** Returns a message if a sign-in password is missing, otherwise undefined. */
export function validatePassword(password: string): string | undefined {
  return password === "" ? "Enter your password." : undefined;
}

/** Returns a message if a new password is too short, otherwise undefined. */
export function validateNewPassword(password: string): string | undefined {
  return password.length < MIN_NEW_PASSWORD_LENGTH
    ? `Choose a password with at least ${String(MIN_NEW_PASSWORD_LENGTH)} characters.`
    : undefined;
}
