import {
  monthContaining,
  todayIn,
  type CreateExpenseInput,
  type Expense,
  type ListExpensesQuery,
  type UpdateExpenseInput,
} from "@thinktwice/shared";
import { and, desc, eq, gte, lte } from "drizzle-orm";

import type { Database, Transaction } from "../../db/client.ts";
import { categories, expenses } from "../../db/schema.ts";
import { withSignedInUser } from "../../db/user-scope.ts";
import { HttpError } from "../../errors/http-error.ts";
import { requireAccount } from "../users/account.ts";

type ExpenseRow = typeof expenses.$inferSelect;

/** Converts an expense row to the shape the API returns. */
function toExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    categoryId: row.categoryId,
    amountCents: row.amountCents,
    spentOn: row.spentOn,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  };
}

/** The error for an expense that doesn't exist or belongs to someone else (the response is the same). */
function expenseNotFound(): HttpError {
  return new HttpError(404, "Expense not found in the user's scope.", {
    publicError: {
      code: "EXPENSE_NOT_FOUND",
      message: "We couldn't find that expense.",
    },
  });
}

/** Throws 400 unless the category exists among the signed-in user's categories (row-level security hides others). */
async function requireOwnCategory(
  transaction: Transaction,
  categoryId: string,
): Promise<void> {
  const [category] = await transaction
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, categoryId));
  if (category === undefined) {
    throw new HttpError(
      400,
      "Expense references a category outside the user's scope.",
      {
        publicError: {
          code: "CATEGORY_NOT_FOUND",
          message: "Choose one of your categories.",
        },
      },
    );
  }
}

/** Throws 400 if the date is later than today in the user's time zone. */
function requireNotFuture(spentOn: string, timeZone: string): void {
  if (spentOn > todayIn(timeZone)) {
    throw new HttpError(400, "Expense dated in the future.", {
      publicError: {
        code: "FUTURE_DATE",
        message: "Expenses can't be dated in the future.",
      },
    });
  }
}

/** Returns the signed-in user's expenses in a date range (default: this month, in their time zone), newest first. */
export async function listExpenses(
  db: Database,
  firebaseUid: string,
  query: ListExpensesQuery,
): Promise<Expense[]> {
  return withSignedInUser(db, firebaseUid, async (transaction, userId) => {
    const account = await requireAccount(transaction, userId);
    const thisMonth = monthContaining(todayIn(account.timezone));
    const from = query.from ?? thisMonth.from;
    const to = query.to ?? thisMonth.to;
    const rows = await transaction
      .select()
      .from(expenses)
      .where(and(gte(expenses.spentOn, from), lte(expenses.spentOn, to)))
      .orderBy(desc(expenses.spentOn), desc(expenses.createdAt))
      .limit(query.limit);
    return rows.map(toExpense);
  });
}

/** Logs an expense for the signed-in user; the date defaults to today in their time zone. */
export async function createExpense(
  db: Database,
  firebaseUid: string,
  input: CreateExpenseInput,
): Promise<Expense> {
  return withSignedInUser(db, firebaseUid, async (transaction, userId) => {
    const account = await requireAccount(transaction, userId);
    const spentOn = input.spentOn ?? todayIn(account.timezone);
    requireNotFuture(spentOn, account.timezone);
    await requireOwnCategory(transaction, input.categoryId);
    const [created] = await transaction
      .insert(expenses)
      .values({
        userId: account.id,
        categoryId: input.categoryId,
        amountCents: input.amountCents,
        spentOn,
        note: input.note ?? null,
      })
      .returning();
    if (created === undefined) {
      throw new Error("Expense insert returned no row.");
    }
    return toExpense(created);
  });
}

/** Edits one of the signed-in user's expenses. */
export async function updateExpense(
  db: Database,
  firebaseUid: string,
  expenseId: string,
  changes: UpdateExpenseInput,
): Promise<Expense> {
  return withSignedInUser(db, firebaseUid, async (transaction, userId) => {
    const account = await requireAccount(transaction, userId);
    if (changes.spentOn !== undefined) {
      requireNotFuture(changes.spentOn, account.timezone);
    }
    if (changes.categoryId !== undefined) {
      await requireOwnCategory(transaction, changes.categoryId);
    }
    const [updated] = await transaction
      .update(expenses)
      .set(changes)
      .where(eq(expenses.id, expenseId))
      .returning();
    if (updated === undefined) {
      throw expenseNotFound();
    }
    return toExpense(updated);
  });
}

/** Permanently deletes one of the signed-in user's expenses. */
export async function deleteExpense(
  db: Database,
  firebaseUid: string,
  expenseId: string,
): Promise<void> {
  await withSignedInUser(db, firebaseUid, async (transaction, userId) => {
    await requireAccount(transaction, userId);
    const deleted = await transaction
      .delete(expenses)
      .where(eq(expenses.id, expenseId))
      .returning({ id: expenses.id });
    if (deleted.length === 0) {
      throw expenseNotFound();
    }
  });
}
