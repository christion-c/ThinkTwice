// Rule 13: proves at the database level that no user can read or change another user's data.
import { eq } from "drizzle-orm";
import pg from "pg";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { createDatabase } from "../../src/db/client.ts";
import { categories, expenses, users } from "../../src/db/schema.ts";
import { withUserScope } from "../../src/db/user-scope.ts";
import { resetDatabase, testDatabaseUrls } from "../helpers/database.ts";
import {
  createCategory,
  createExpense,
  createUser,
  type TestUser,
} from "../helpers/fixtures.ts";
import {
  expectPostgresError,
  PostgresErrorCode,
} from "../helpers/postgres-errors.ts";

const urls = testDatabaseUrls();
const { db, pool } = createDatabase(urls.app);

let alice: TestUser;
let bob: TestUser;
let bobCategoryId: string;
let bobExpenseId: string;

beforeEach(async () => {
  await resetDatabase(urls.owner);
  alice = await createUser(db, "alice-firebase-uid");
  bob = await createUser(db, "bob-firebase-uid");
  const aliceCategory = await createCategory(db, alice);
  await createExpense(db, alice, aliceCategory.id);
  const bobCategory = await createCategory(db, bob);
  bobCategoryId = bobCategory.id;
  bobExpenseId = (await createExpense(db, bob, bobCategory.id, 999)).id;
});

afterAll(async () => {
  await pool.end();
});

describe("reading", () => {
  it("a user sees only their own user row", async () => {
    const rows = await withUserScope(db, alice.scope, (tx) =>
      tx.select().from(users),
    );
    expect(rows.map((row) => row.id)).toEqual([alice.id]);
  });

  it("a user sees only their own categories and expenses", async () => {
    const { categoryOwners, expenseOwners } = await withUserScope(
      db,
      alice.scope,
      async (tx) => ({
        categoryOwners: (await tx.select().from(categories)).map(
          (row) => row.userId,
        ),
        expenseOwners: (await tx.select().from(expenses)).map(
          (row) => row.userId,
        ),
      }),
    );
    expect(categoryOwners).toEqual([alice.id]);
    expect(expenseOwners).toEqual([alice.id]);
  });

  it("guessing another user's record ID returns nothing", async () => {
    const rows = await withUserScope(db, alice.scope, (tx) =>
      tx.select().from(expenses).where(eq(expenses.id, bobExpenseId)),
    );
    expect(rows).toEqual([]);
  });

  it("queries outside a user scope see nothing", async () => {
    expect(await db.select().from(users)).toEqual([]);
    expect(await db.select().from(categories)).toEqual([]);
    expect(await db.select().from(expenses)).toEqual([]);
  });

  it("a user's scope ends when their transaction ends", async () => {
    const client = new pg.Client({ connectionString: urls.app });
    await client.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "SELECT set_config('app.firebase_uid', $1, true), set_config('app.user_id', $2, true)",
        [alice.firebaseUid, alice.id],
      );
      await client.query("COMMIT");
      const { rows } = await client.query("SELECT id FROM categories");
      expect(rows).toEqual([]);
    } finally {
      await client.end();
    }
  });

  it("the table owner is also limited by row-level security", async () => {
    const client = new pg.Client({ connectionString: urls.owner });
    await client.connect();
    try {
      const { rows } = await client.query("SELECT id FROM expenses");
      expect(rows).toEqual([]);
    } finally {
      await client.end();
    }
  });
});

describe("writing", () => {
  it("a user can't update or delete another user's rows", async () => {
    await withUserScope(db, alice.scope, async (tx) => {
      const updated = await tx
        .update(categories)
        .set({ name: "Hacked" })
        .where(eq(categories.id, bobCategoryId))
        .returning();
      const deleted = await tx
        .delete(expenses)
        .where(eq(expenses.id, bobExpenseId))
        .returning();
      expect(updated).toEqual([]);
      expect(deleted).toEqual([]);
    });

    const bobRows = await withUserScope(db, bob.scope, async (tx) => ({
      categoryNames: (await tx.select().from(categories)).map(
        (row) => row.name,
      ),
      expenseAmounts: (await tx.select().from(expenses)).map(
        (row) => row.amountCents,
      ),
    }));
    expect(bobRows).toEqual({
      categoryNames: ["Coffee"],
      expenseAmounts: [999],
    });
  });

  it("a user can't create rows owned by another user", async () => {
    await expectPostgresError(
      withUserScope(db, alice.scope, (tx) =>
        tx
          .insert(categories)
          .values({ userId: bob.id, name: "Planted", type: "essential" }),
      ),
      PostgresErrorCode.insufficientPrivilege,
    );
  });

  it("a user can't hand their own rows to another user", async () => {
    await expectPostgresError(
      withUserScope(db, alice.scope, (tx) =>
        tx.update(categories).set({ userId: bob.id }),
      ),
      PostgresErrorCode.insufficientPrivilege,
    );
  });

  it("a user can't create a user row for a different Firebase account", async () => {
    await expectPostgresError(
      withUserScope(db, alice.scope, (tx) =>
        tx.insert(users).values({
          firebaseUid: "mallory-firebase-uid",
          email: "m@example.com",
          timezone: "UTC",
        }),
      ),
      PostgresErrorCode.insufficientPrivilege,
    );
  });

  it("an expense can't use another user's category", async () => {
    await expectPostgresError(
      withUserScope(db, alice.scope, (tx) =>
        tx.insert(expenses).values({
          userId: alice.id,
          categoryId: bobCategoryId,
          amountCents: 100,
          spentOn: "2026-10-22",
        }),
      ),
      PostgresErrorCode.foreignKeyViolation,
    );
  });
});

describe("account deletion", () => {
  it("deleting a user deletes all of their data and nobody else's", async () => {
    await withUserScope(db, alice.scope, (tx) =>
      tx.delete(users).where(eq(users.id, alice.id)),
    );

    const aliceLeftovers = await withUserScope(db, alice.scope, async (tx) => [
      ...(await tx.select().from(users)),
      ...(await tx.select().from(categories)),
      ...(await tx.select().from(expenses)),
    ]);
    expect(aliceLeftovers).toEqual([]);

    const bobCounts = await withUserScope(db, bob.scope, async (tx) => ({
      users: (await tx.select().from(users)).length,
      categories: (await tx.select().from(categories)).length,
      expenses: (await tx.select().from(expenses)).length,
    }));
    expect(bobCounts).toEqual({ users: 1, categories: 1, expenses: 1 });
  });
});
