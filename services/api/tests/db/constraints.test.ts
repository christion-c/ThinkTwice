import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { createDatabase } from "../../src/db/client.ts";
import { categories, expenses } from "../../src/db/schema.ts";
import { withUserScope } from "../../src/db/user-scope.ts";
import { resetDatabase, testDatabaseUrls } from "../helpers/database.ts";
import {
  createCategory,
  createExpense,
  createUser,
  onlyRow,
  type TestUser,
} from "../helpers/fixtures.ts";
import {
  expectPostgresError,
  PostgresErrorCode,
} from "../helpers/postgres-errors.ts";

const urls = testDatabaseUrls();
const { db, pool } = createDatabase(urls.app);

let user: TestUser;
let categoryId: string;

beforeEach(async () => {
  await resetDatabase(urls.owner);
  user = await createUser(db, "constraints-firebase-uid");
  categoryId = (await createCategory(db, user)).id;
});

afterAll(async () => {
  await pool.end();
});

/** Tries to insert an expense with the given amount and note for the test user. */
function insertExpense(amountCents: number, note: string | null = null) {
  return withUserScope(db, user.scope, (tx) =>
    tx.insert(expenses).values({
      userId: user.id,
      categoryId,
      amountCents,
      spentOn: "2026-10-22",
      note,
    }),
  );
}

/** Tries to insert a category with the given name for the test user. */
function insertCategory(name: string) {
  return withUserScope(db, user.scope, (tx) =>
    tx.insert(categories).values({ userId: user.id, name, type: "essential" }),
  );
}

describe("expense constraints", () => {
  it.each([0, -100, 10_000_001])(
    "reject the amount %p",
    async (amountCents) => {
      await expectPostgresError(
        insertExpense(amountCents),
        PostgresErrorCode.checkViolation,
      );
    },
  );

  it("reject notes over 200 characters", async () => {
    await expectPostgresError(
      insertExpense(100, "x".repeat(201)),
      PostgresErrorCode.checkViolation,
    );
  });
});

describe("category constraints", () => {
  it("reject a duplicate name, ignoring case", async () => {
    await expectPostgresError(
      insertCategory("COFFEE"),
      PostgresErrorCode.uniqueViolation,
    );
  });

  it.each(["", " Padded", "x".repeat(41)])(
    "reject the name %p",
    async (name) => {
      await expectPostgresError(
        insertCategory(name),
        PostgresErrorCode.checkViolation,
      );
    },
  );
});

describe("generated values", () => {
  it("IDs are UUIDv7", async () => {
    const expense = await createExpense(db, user, categoryId);
    expect(expense.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("updated_at changes on every update", async () => {
    const expense = await createExpense(db, user, categoryId);
    const updated = await withUserScope(db, user.scope, async (tx) =>
      onlyRow(
        await tx
          .update(expenses)
          .set({ amountCents: 500 })
          .where(eq(expenses.id, expense.id))
          .returning(),
      ),
    );
    expect(updated.updatedAt.getTime()).toBeGreaterThan(
      expense.updatedAt.getTime(),
    );
  });
});
