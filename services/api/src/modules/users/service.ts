import {
  DEFAULT_CATEGORIES,
  type UpdateUserSettingsInput,
  type UserProfile,
} from "@thinktwice/shared";
import { eq } from "drizzle-orm";

import type { VerifiedIdentity } from "../../auth/firebase-token.ts";
import type { Database } from "../../db/client.ts";
import { categories, users } from "../../db/schema.ts";
import { setUserScope, withSignedInUser } from "../../db/user-scope.ts";
import { HttpError } from "../../errors/http-error.ts";
import { accountNotFound, requireAccount, type Account } from "./account.ts";

export interface CreateAccountResult {
  profile: UserProfile;
  /** False when the account already existed (creating it is safe to repeat). */
  created: boolean;
}

/** Converts a user row to the profile the API returns. */
function toProfile(user: Account): UserProfile {
  return {
    id: user.id,
    email: user.email,
    timezone: user.timezone,
    monthlyBudgetCents: user.monthlyBudgetCents,
    createdAt: user.createdAt.toISOString(),
  };
}

/** Returns the signed-in user's profile, or throws 404 if they have no account. */
export async function getProfile(
  db: Database,
  firebaseUid: string,
): Promise<UserProfile> {
  return withSignedInUser(db, firebaseUid, async (transaction, userId) =>
    toProfile(await requireAccount(transaction, userId)),
  );
}

/**
 * Creates the signed-in user's account and their default categories, or returns the existing account.
 * Safe to call repeatedly or concurrently: the unique Firebase UID means only one account is ever created.
 */
export async function createAccount(
  db: Database,
  identity: VerifiedIdentity,
  timezone: string,
): Promise<CreateAccountResult> {
  const { firebaseUid, email } = identity;
  if (email === null) {
    throw new HttpError(400, "Verified token has no email.", {
      publicError: {
        code: "EMAIL_REQUIRED",
        message: "Please sign in with an account that has an email address.",
      },
    });
  }

  return withSignedInUser(
    db,
    firebaseUid,
    async (transaction, existingUserId) => {
      if (existingUserId !== null) {
        return {
          profile: toProfile(await requireAccount(transaction, existingUserId)),
          created: false,
        };
      }

      const [inserted] = await transaction
        .insert(users)
        .values({ firebaseUid, email, timezone })
        .onConflictDoNothing({ target: users.firebaseUid })
        .returning();
      if (inserted === undefined) {
        // A concurrent request created the account between the lookup and the insert.
        const [existing] = await transaction
          .select()
          .from(users)
          .where(eq(users.firebaseUid, firebaseUid));
        if (existing === undefined) {
          throw new Error(
            "Account insert conflicted but no account was found.",
          );
        }
        return { profile: toProfile(existing), created: false };
      }

      await setUserScope(transaction, { firebaseUid, userId: inserted.id });
      await transaction.insert(categories).values(
        DEFAULT_CATEGORIES.map((category, index) => ({
          userId: inserted.id,
          name: category.name,
          type: category.type,
          sortOrder: index,
        })),
      );
      return { profile: toProfile(inserted), created: true };
    },
  );
}

/** Updates the signed-in user's settings and returns their profile, or throws 404 if they have no account. */
export async function updateSettings(
  db: Database,
  firebaseUid: string,
  settings: UpdateUserSettingsInput,
): Promise<UserProfile> {
  return withSignedInUser(db, firebaseUid, async (transaction, userId) => {
    const user = await requireAccount(transaction, userId);
    const [updated] = await transaction
      .update(users)
      .set(settings)
      .where(eq(users.id, user.id))
      .returning();
    if (updated === undefined) {
      throw accountNotFound();
    }
    return toProfile(updated);
  });
}

/**
 * Permanently deletes the signed-in user's account and, through the database's cascades, all of their data.
 * The app deletes their Firebase sign-in account afterwards.
 */
export async function deleteAccount(
  db: Database,
  firebaseUid: string,
): Promise<void> {
  await withSignedInUser(db, firebaseUid, async (transaction, userId) => {
    const user = await requireAccount(transaction, userId);
    await transaction.delete(users).where(eq(users.id, user.id));
  });
}
