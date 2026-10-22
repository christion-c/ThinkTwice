import * as z from "zod";

import { amountCentsSchema } from "./money.js";
import { partialUpdateSchema } from "./updates.js";

export const EXPENSE_NOTE_MAX_LENGTH = 200;

/** A calendar date in YYYY-MM-DD form, in the user's local time. */
export const spentOnSchema = z.iso.date(
  "Date must be a real date in YYYY-MM-DD form.",
);

/** An optional note: trimmed, at most 200 characters; empty becomes null. */
export const expenseNoteSchema = z
  .string()
  .trim()
  .max(
    EXPENSE_NOTE_MAX_LENGTH,
    `Note can be at most ${String(EXPENSE_NOTE_MAX_LENGTH)} characters.`,
  )
  .transform((note) => (note === "" ? null : note))
  .nullable();

/** Request body for logging an expense. Unknown fields are rejected. */
export const createExpenseSchema = z.strictObject({
  amountCents: amountCentsSchema,
  categoryId: z.uuid("Category is invalid."),
  spentOn: spentOnSchema.optional(),
  note: expenseNoteSchema.optional(),
});
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

/** Request body for editing an expense. At least one field is required. */
export const updateExpenseSchema = partialUpdateSchema({
  amountCents: amountCentsSchema,
  categoryId: z.uuid("Category is invalid."),
  spentOn: spentOnSchema,
  note: expenseNoteSchema,
});
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

/** Most expenses one list request returns. */
export const MAX_EXPENSES_PER_PAGE = 500;

/** Query string for listing expenses: a date range (defaults to this month) and a limit. */
export const listExpensesQuerySchema = z
  .strictObject({
    from: spentOnSchema.optional(),
    to: spentOnSchema.optional(),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(MAX_EXPENSES_PER_PAGE)
      .default(200),
  })
  .refine(
    ({ from, to }) => from === undefined || to === undefined || from <= to,
    "The start date must be on or before the end date.",
  );
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;

/** An expense, as the API returns it. */
export const expenseSchema = z.object({
  id: z.uuid(),
  categoryId: z.uuid(),
  amountCents: z.int(),
  spentOn: spentOnSchema,
  note: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export type Expense = z.infer<typeof expenseSchema>;

/** A page of the signed-in user's expenses, newest first. */
export const expenseListSchema = z.object({
  expenses: z.array(expenseSchema),
});
export type ExpenseList = z.infer<typeof expenseListSchema>;
