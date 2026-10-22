import { eq, sql } from "drizzle-orm";

import type { Database, Transaction } from "./client.ts";
import { users } from "./schema.ts";

/** Who a database transaction acts for. userId is null until the user's row has been looked up or created. */
export interface UserScope {
  firebaseUid: string;
  userId: string | null;
}

/** Sets the row-level security settings for the rest of the transaction. */
export async function setUserScope(
  transaction: Transaction,
  scope: UserScope,
): Promise<void> {
  await transaction.execute(
    sql`SELECT set_config('app.firebase_uid', ${scope.firebaseUid}, true), set_config('app.user_id', ${scope.userId ?? ""}, true)`,
  );
}

/**
 * Runs work in a transaction that row-level security limits to one user's data.
 * Every query on user data must go through this (or withSignedInUser); the settings end with the transaction.
 */
export async function withUserScope<T>(
  db: Database,
  scope: UserScope,
  work: (transaction: Transaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (transaction) => {
    await setUserScope(transaction, scope);
    return work(transaction);
  });
}

/**
 * Runs work for the user behind a verified Firebase UID. Looks up their user ID inside their own scope, so the
 * lookup itself can only ever find their row. userId is null if they haven't created their ThinkTwice account yet.
 */
export async function withSignedInUser<T>(
  db: Database,
  firebaseUid: string,
  work: (transaction: Transaction, userId: string | null) => Promise<T>,
): Promise<T> {
  return db.transaction(async (transaction) => {
    await setUserScope(transaction, { firebaseUid, userId: null });
    const [user] = await transaction
      .select({ id: users.id })
      .from(users)
      .where(eq(users.firebaseUid, firebaseUid));
    const userId = user?.id ?? null;
    if (userId !== null) {
      await setUserScope(transaction, { firebaseUid, userId });
    }
    return work(transaction, userId);
  });
}
