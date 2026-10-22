import { Platform } from "react-native";
import * as z from "zod";

const configSchema = z.object({
  firebase: z.object({
    apiKey: z.string().min(1),
    authDomain: z.string().min(1),
    projectId: z.string().min(1),
    appId: z.string().min(1),
  }),
  apiUrl: z.url(),
});

export type AppConfig = z.infer<typeof configSchema>;

const LOCALHOST_URL = /^(https?:\/\/)(localhost|127\.0\.0\.1)(?=[:/]|$)/;

/** On the Android emulator, "localhost" is the emulator itself; 10.0.2.2 is the computer running it. */
export function resolveApiUrl(url: string, platform: string): string {
  return platform === "android"
    ? url.replace(LOCALHOST_URL, "$110.0.2.2")
    : url;
}

let cachedConfig: AppConfig | undefined;

/** Returns the app's settings from its EXPO_PUBLIC_ variables (see .env.example), failing clearly if any is missing. */
export function getConfig(): AppConfig {
  if (cachedConfig !== undefined) {
    return cachedConfig;
  }
  // Each variable is read by its full name so Expo can build its value into the app.
  const result = configSchema.safeParse({
    firebase: {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    },
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
  });
  if (!result.success) {
    throw new Error(
      `The app's configuration is incomplete. Copy apps/app/.env.example to apps/app/.env and fill it in.\n${z.prettifyError(result.error)}`,
    );
  }
  cachedConfig = {
    ...result.data,
    apiUrl: resolveApiUrl(result.data.apiUrl, Platform.OS),
  };
  return cachedConfig;
}
