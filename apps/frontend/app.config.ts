import type { ConfigContext, ExpoConfig } from "expo/config";

// Public client config the JS bundle needs at runtime. Locally these come
// from apps/frontend/.env, but .env is gitignored and never uploaded to
// EAS - cloud builds read them from the EAS environment named by the
// profile's "environment" in eas.json instead (expo.dev > Environment
// variables, or `eas env:list --environment production`).
const REQUIRED_PUBLIC_ENV = [
  "EXPO_PUBLIC_API_URL",
  "EXPO_PUBLIC_FIREBASE_API_KEY",
  "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "EXPO_PUBLIC_FIREBASE_APP_ID",
] as const;

// Static config lives in app.json; this only adds a build-time guard.
export default ({ config }: ConfigContext): ExpoConfig => {
  // EAS_BUILD_PROFILE is set only on EAS build workers. Release builds
  // (preview/production) embed these values into the bundle, so a missing
  // one would otherwise produce a build that installs fine but can't sign
  // anyone in. Development builds load JS from the local Metro server
  // (which reads .env), so they don't need the values on EAS.
  const profile = process.env.EAS_BUILD_PROFILE;
  if (profile && profile !== "development") {
    const missing = REQUIRED_PUBLIC_ENV.filter((name) => !process.env[name]?.trim());
    if (missing.length > 0) {
      throw new Error(
        `EAS "${profile}" build is missing required environment variables: ${missing.join(", ")}. ` +
          `Add them to the EAS environment this profile uses (eas.json "environment") - ` +
          `see \`eas env:list\` - since apps/frontend/.env is not uploaded to EAS.`,
      );
    }
  }

  return config as ExpoConfig;
};
