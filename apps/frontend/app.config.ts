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
  // Native Google sign-in's Web OAuth client ID (lib/google-sign-in.native.ts).
  "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID",
] as const;

// "123-abc.apps.googleusercontent.com" -> "com.googleusercontent.apps.123-abc",
// the URL scheme iOS needs to return from Google's sign-in screen.
function iosUrlSchemeFor(iosClientId: string): string {
  return `com.googleusercontent.apps.${iosClientId.replace(/\.apps\.googleusercontent\.com$/, "")}`;
}

// Static config lives in app.json; this adds a build-time guard and the
// Google Sign-In config plugin.
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

  // Without Firebase config files, the Google Sign-In plugin only sets the
  // iOS URL scheme (Android needs no plugin, just the signing keys' SHA-1
  // registered with Google), and it throws without one - so it's added
  // only once an iOS client ID exists.
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  const plugins = [...(config.plugins ?? [])];
  if (iosClientId) {
    plugins.push(["@react-native-google-signin/google-signin", { iosUrlScheme: iosUrlSchemeFor(iosClientId) }]);
  }

  return { ...config, plugins } as ExpoConfig;
};
