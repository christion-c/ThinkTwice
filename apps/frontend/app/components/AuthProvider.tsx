import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";

import { auth, isFirebaseConfigured } from "../../lib/firebase";

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const AUTH_INITIALIZATION_TIMEOUT_MS = 5000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setInitializing(false);
      return;
    }

    const firebaseAuth = auth;
    let active = true;

    const completeInitialization = (nextUser: User | null) => {
      if (!active) {
        return;
      }

      setUser(nextUser);
      setInitializing(false);
    };

    const timeoutId = setTimeout(() => {
      console.warn(
        "Firebase authentication initialization timed out; continuing without a restored session.",
      );
      completeInitialization(firebaseAuth.currentUser);
    }, AUTH_INITIALIZATION_TIMEOUT_MS);

    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      (nextUser) => {
        if (active) {
          setUser(nextUser);
        }
      },
      (error) => {
        console.error("Firebase authentication initialization failed:", error);
        clearTimeout(timeoutId);
        completeInitialization(null);
      },
    );

    void firebaseAuth
      .authStateReady()
      .then(() => {
        clearTimeout(timeoutId);
        completeInitialization(firebaseAuth.currentUser);
      })
      .catch((error) => {
        console.error("Firebase authentication initialization failed:", error);
        clearTimeout(timeoutId);
        completeInitialization(null);
      });

    return () => {
      active = false;
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing,
    }),
    [user, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
