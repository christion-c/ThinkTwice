import * as z from "zod";

import { amountCentsSchema } from "./money.js";
import { partialUpdateSchema } from "./updates.js";

/** Returns true if the runtime recognizes the name as an IANA time zone. */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch (error) {
    if (error instanceof RangeError) {
      return false;
    }
    throw error;
  }
}

/** An IANA time zone name such as "America/Chicago". */
export const timeZoneSchema = z
  .string()
  .min(1, "Time zone is required.")
  .max(64, "Time zone is invalid.")
  .refine(isValidTimeZone, "Time zone is invalid.");

/** Request body for updating the user's settings. At least one field is required. */
export const updateUserSettingsSchema = partialUpdateSchema({
  timezone: timeZoneSchema,
  monthlyBudgetCents: amountCentsSchema.nullable(),
});
export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;

/** Request body for creating the signed-in user's ThinkTwice account. Email comes from the verified token. */
export const createAccountSchema = z.strictObject({
  timezone: timeZoneSchema,
});
export type CreateAccountInput = z.infer<typeof createAccountSchema>;

/** The signed-in user's account, as the API returns it. */
export const userProfileSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  timezone: z.string(),
  monthlyBudgetCents: z.int().nullable(),
  createdAt: z.iso.datetime(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;
