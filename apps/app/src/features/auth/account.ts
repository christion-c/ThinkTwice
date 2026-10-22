import {
  isValidTimeZone,
  userProfileSchema,
  type UserProfile,
} from "@thinktwice/shared";

import { apiRequest } from "../../lib/api";

/** Returns the device's time zone (e.g. "America/Chicago"), or "UTC" if it can't be determined. */
export function deviceTimeZone(): string {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return isValidTimeZone(timeZone) ? timeZone : "UTC";
}

/** Creates the signed-in user's ThinkTwice account, or returns it if it already exists. Safe to call on every sign-in. */
export function ensureAccount(): Promise<UserProfile> {
  return apiRequest("/me", {
    method: "POST",
    body: { timezone: deviceTimeZone() },
    schema: userProfileSchema,
  });
}
