// Loading the signed-in user's own account, shared by every module that works with their data.
import { eq } from "drizzle-orm";

import type { Transaction } from "../../db/client.ts";
import { users } from "../../db/schema.ts";
import { HttpError } from "../../errors/http-error.ts";

export type Account = typeof users.$inferSelect;

/** Returns the error for a signed-in user who hasn't created their ThinkTwice account yet. */
export function accountNotFound(): HttpError {
  return new HttpError(404, "Signed-in user has no account.", {
    publicError: {
      code: "ACCOUNT_NOT_FOUND",
      message: "Let's finish setting up your account first.",
    },
  });
}

/** Loads the signed-in user's account inside their scope, or throws 404 if they haven't created one. */
export async function requireAccount(
  transaction: Transaction,
  userId: string | null,
): Promise<Account> {
  if (userId === null) {
    throw accountNotFound();
  }
  const [account] = await transaction
    .select()
    .from(users)
    .where(eq(users.id, userId));
  if (account === undefined) {
    throw accountNotFound();
  }
  return account;
}
