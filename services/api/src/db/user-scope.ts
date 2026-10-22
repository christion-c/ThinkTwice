import { sql } from "drizzle-orm";

import type { Database, Transaction } from "./client.ts";

/** Who a database transaction acts for. userId is null until the user's row has been looked up or created. */
export interface UserScope {
  firebaseUid: string;
  userId: string | null;
}

/**
 * Runs work in a transaction that row-level security limits to one user's data.
 * Every query on user data must go through this; the settings end with the transaction.
 */
export async function withUserScope<T>(
  db: Database,
  scope: UserScope,
  work: (transaction: Transaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (transaction) => {
    await transaction.execute(
      sql`SELECT set_config('app.firebase_uid', ${scope.firebaseUid}, true), set_config('app.user_id', ${scope.userId ?? ""}, true)`,
    );
    return work(transaction);
  });
}
