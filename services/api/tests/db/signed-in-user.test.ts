import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { createDatabase } from "../../src/db/client.ts";
import { categories, users } from "../../src/db/schema.ts";
import { withSignedInUser } from "../../src/db/user-scope.ts";
import { resetDatabase, testDatabaseUrls } from "../helpers/database.ts";
import {
  createCategory,
  createUser,
  type TestUser,
} from "../helpers/fixtures.ts";

const urls = testDatabaseUrls();
const { db, pool } = createDatabase(urls.app);

let alice: TestUser;

beforeEach(async () => {
  await resetDatabase(urls.owner);
  alice = await createUser(db, "alice-firebase-uid");
  await createCategory(db, alice);
  const bob = await createUser(db, "bob-firebase-uid");
  await createCategory(db, bob);
});

afterAll(async () => {
  await pool.end();
});

describe("withSignedInUser", () => {
  it("finds the signed-in user and limits queries to their data", async () => {
    const result = await withSignedInUser(
      db,
      alice.firebaseUid,
      async (tx, userId) => ({
        userId,
        categoryOwners: (await tx.select().from(categories)).map(
          (row) => row.userId,
        ),
      }),
    );
    expect(result).toEqual({ userId: alice.id, categoryOwners: [alice.id] });
  });

  it("returns no user, and no data, for someone without a ThinkTwice account yet", async () => {
    const result = await withSignedInUser(
      db,
      "newcomer-firebase-uid",
      async (tx, userId) => ({
        userId,
        users: await tx.select().from(users),
        categories: await tx.select().from(categories),
      }),
    );
    expect(result).toEqual({ userId: null, users: [], categories: [] });
  });
});
