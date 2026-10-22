import type { Database } from "../../src/db/client.ts";
import { categories, expenses, users } from "../../src/db/schema.ts";
import { withUserScope, type UserScope } from "../../src/db/user-scope.ts";

export interface TestUser {
  id: string;
  firebaseUid: string;
  scope: UserScope;
}

/** Returns the only row a query returned, failing the test if there wasn't exactly one. */
export function onlyRow<Row>(rows: Row[]): Row {
  const [row] = rows;
  if (row === undefined || rows.length !== 1) {
    throw new Error(`Expected exactly one row, got ${String(rows.length)}.`);
  }
  return row;
}

/** Creates a user the way the API will: inside that user's own scope. */
export async function createUser(
  db: Database,
  firebaseUid: string,
): Promise<TestUser> {
  const user = await withUserScope(
    db,
    { firebaseUid, userId: null },
    async (transaction) =>
      onlyRow(
        await transaction
          .insert(users)
          .values({
            firebaseUid,
            email: `${firebaseUid}@example.com`,
            timezone: "UTC",
          })
          .returning(),
      ),
  );
  return { id: user.id, firebaseUid, scope: { firebaseUid, userId: user.id } };
}

/** Creates a category owned by the given user. */
export async function createCategory(
  db: Database,
  owner: TestUser,
  name = "Coffee",
) {
  return withUserScope(db, owner.scope, async (transaction) =>
    onlyRow(
      await transaction
        .insert(categories)
        .values({ userId: owner.id, name, type: "discretionary" })
        .returning(),
    ),
  );
}

/** Creates an expense owned by the given user in one of their categories. */
export async function createExpense(
  db: Database,
  owner: TestUser,
  categoryId: string,
  amountCents = 450,
) {
  return withUserScope(db, owner.scope, async (transaction) =>
    onlyRow(
      await transaction
        .insert(expenses)
        .values({
          userId: owner.id,
          categoryId,
          amountCents,
          spentOn: "2026-10-22",
        })
        .returning(),
    ),
  );
}
