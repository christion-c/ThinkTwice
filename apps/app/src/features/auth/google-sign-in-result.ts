// Shared by google-sign-in.ts (web) and google-sign-in.native.ts (iOS and Android).

/** "cancelled" means the user closed Google's sign-in without choosing an account; that's not an error. */
export type GoogleSignInResult = "signedIn" | "cancelled";

/** A Google sign-in problem with a message that's safe to show to the user. */
export class GoogleSignInError extends Error {
  /** Creates an error whose message is meant for the user. */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "GoogleSignInError";
  }
}
