import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@thinktwice/shared";
import { asc, eq, max } from "drizzle-orm";

import type { Database } from "../../db/client.ts";
import {
  PostgresErrorCode,
  postgresErrorCode,
} from "../../db/postgres-errors.ts";
import { categories } from "../../db/schema.ts";
import { withSignedInUser } from "../../db/user-scope.ts";
import { HttpError } from "../../errors/http-error.ts";
import { requireAccount } from "../users/account.ts";

type CategoryRow = typeof categories.$inferSelect;

/** Converts a category row to the shape the API returns. */
function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    isHidden: row.isHidden,
    sortOrder: row.sortOrder,
  };
}

/** The error for a category that doesn't exist or belongs to someone else (the response is the same). */
export function categoryNotFound(): HttpError {
  return new HttpError(404, "Category not found in the user's scope.", {
    publicError: {
      code: "CATEGORY_NOT_FOUND",
      message: "We couldn't find that category.",
    },
  });
}

/** Turns a duplicate-name database error into a friendly 409, and passes any other error on. */
function nameTakenOr(error: unknown): unknown {
  return postgresErrorCode(error) === PostgresErrorCode.uniqueViolation
    ? new HttpError(409, "Duplicate category name.", {
        cause: error,
        publicError: {
          code: "CATEGORY_NAME_TAKEN",
          message: "You already have a category with that name.",
        },
      })
    : error;
}

/** Returns the signed-in user's categories, in display order. */
export async function listCategories(
  db: Database,
  firebaseUid: string,
): Promise<Category[]> {
  return withSignedInUser(db, firebaseUid, async (transaction, userId) => {
    await requireAccount(transaction, userId);
    const rows = await transaction
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.name));
    return rows.map(toCategory);
  });
}

/** Adds a category at the end of the signed-in user's list. */
export async function createCategory(
  db: Database,
  firebaseUid: string,
  input: CreateCategoryInput,
): Promise<Category> {
  return withSignedInUser(db, firebaseUid, async (transaction, userId) => {
    const account = await requireAccount(transaction, userId);
    const [last] = await transaction
      .select({ sortOrder: max(categories.sortOrder) })
      .from(categories);
    try {
      const [created] = await transaction
        .insert(categories)
        .values({
          userId: account.id,
          name: input.name,
          type: input.type,
          sortOrder: (last?.sortOrder ?? -1) + 1,
        })
        .returning();
      if (created === undefined) {
        throw new Error("Category insert returned no row.");
      }
      return toCategory(created);
    } catch (error) {
      throw nameTakenOr(error);
    }
  });
}

/** Renames, retypes, hides/unhides or reorders one of the signed-in user's categories. */
export async function updateCategory(
  db: Database,
  firebaseUid: string,
  categoryId: string,
  changes: UpdateCategoryInput,
): Promise<Category> {
  return withSignedInUser(db, firebaseUid, async (transaction, userId) => {
    await requireAccount(transaction, userId);
    try {
      const [updated] = await transaction
        .update(categories)
        .set(changes)
        .where(eq(categories.id, categoryId))
        .returning();
      if (updated === undefined) {
        throw categoryNotFound();
      }
      return toCategory(updated);
    } catch (error) {
      throw nameTakenOr(error);
    }
  });
}
