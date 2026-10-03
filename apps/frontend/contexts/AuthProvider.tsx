import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged, updateProfile } from "firebase/auth";

import { auth, isFirebaseConfigured } from "@/lib/firebase";

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
  // Saves a new display name to Firebase. Throws on failure for the
  // caller to report.
  updateDisplayName: (displayName: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // isFirebaseConfigured/auth are module-level constants fixed at import
  // time, so whether there's anything to wait on is already known before
  // the first render - no need for an effect to flip this to false.
  const [initializing, setInitializing] = useState(() => Boolean(isFirebaseConfigured && auth));

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  // updateProfile edits the User object in place without firing
  // onAuthStateChanged, so this counter is what re-renders consumers
  // that read user.displayName.
  const [profileVersion, setProfileVersion] = useState(0);

  const updateDisplayName = useCallback(
    async (displayName: string) => {
      if (!user) {
        throw new Error("Sign in to change your name.");
      }

      await updateProfile(user, { displayName });
      // The backend copies the name from the ID token's claims on each
      // request (sync-current-user), so refresh the token now rather
      // than waiting up to an hour for it to expire.
      await user.getIdToken(true);
      setProfileVersion((version) => version + 1);
    },
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      initializing,
      updateDisplayName,
      profileVersion,
    }),
    [user, initializing, updateDisplayName, profileVersion],
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
