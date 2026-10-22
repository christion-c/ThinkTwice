import type { UserProfile } from "@thinktwice/shared";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ApiError } from "../../lib/api";
import { getFirebaseAuth } from "../../lib/firebase";
import { ensureAccount } from "./account";

/** Where the user is in signing in. Only "ready" users can see the app's main screens. */
export type AuthState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "settingUp"; user: User }
  | { status: "setupFailed"; user: User; message: string }
  | { status: "ready"; user: User; profile: UserProfile };

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  retryAccountSetup: () => void;
}

export type AuthContextValue = AuthActions & { state: AuthState };

export const AuthContext = createContext<AuthContextValue | null>(null);

/** Returns the current sign-in state and actions. Must be used inside AuthProvider. */
export function useAuth(): AuthContextValue {
  const value = use(AuthContext);
  if (value === null) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }
  return value;
}

/** Returns a friendly message for an account setup failure. */
function setupErrorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "We couldn't finish setting up your account. Please try again.";
}

/** Tracks the Firebase sign-in, creates the ThinkTwice account after sign-in, and provides sign-in actions. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  // Creates (or loads) the account for a signed-in Firebase user.
  const setUpAccount = useCallback(async (user: User) => {
    setState({ status: "settingUp", user });
    try {
      const profile = await ensureAccount();
      setState({ status: "ready", user, profile });
    } catch (error) {
      setState({
        status: "setupFailed",
        user,
        message: setupErrorMessage(error),
      });
    }
  }, []);

  useEffect(
    () =>
      onAuthStateChanged(getFirebaseAuth(), (user) => {
        if (user === null) {
          setState({ status: "signedOut" });
        } else {
          void setUpAccount(user);
        }
      }),
    [setUpAccount],
  );

  const actions = useMemo<AuthActions>(
    () => ({
      signIn: async (email, password) => {
        await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      },
      signUp: async (email, password) => {
        await createUserWithEmailAndPassword(
          getFirebaseAuth(),
          email,
          password,
        );
      },
      signOut: () => firebaseSignOut(getFirebaseAuth()),
      resetPassword: (email) =>
        sendPasswordResetEmail(getFirebaseAuth(), email),
      retryAccountSetup: () => {
        const user = getFirebaseAuth().currentUser;
        if (user !== null) {
          void setUpAccount(user);
        }
      },
    }),
    [setUpAccount],
  );

  const value = useMemo(() => ({ ...actions, state }), [actions, state]);
  return <AuthContext value={value}>{children}</AuthContext>;
}
