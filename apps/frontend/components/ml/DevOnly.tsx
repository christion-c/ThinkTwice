import { Redirect } from "expo-router";
import type { ReactNode } from "react";

// Wraps the internal ML debug screens: they render in development builds
// only, and production builds (web export, EAS) send anyone who opens
// the URL back to Home. The backend's /predictions/preview proxy still
// answers signed-in users with their own data; this only hides the pages.
export default function DevOnly({ children }: { children: ReactNode }) {
  return __DEV__ ? children : <Redirect href="/" />;
}
