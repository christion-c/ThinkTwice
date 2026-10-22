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
