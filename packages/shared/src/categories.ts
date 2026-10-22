import * as z from "zod";

import { partialUpdateSchema } from "./updates.js";

export const CATEGORY_TYPES = ["essential", "discretionary"] as const;

/** Whether spending in a category is essential or discretionary. */
export const categoryTypeSchema = z.enum(CATEGORY_TYPES);
export type CategoryType = z.infer<typeof categoryTypeSchema>;

export const CATEGORY_NAME_MAX_LENGTH = 40;

/** A category name: trimmed, 1 to 40 characters. */
export const categoryNameSchema = z
  .string()
  .trim()
  .min(1, "Category name can't be empty.")
  .max(
    CATEGORY_NAME_MAX_LENGTH,
    `Category name can be at most ${String(CATEGORY_NAME_MAX_LENGTH)} characters.`,
  );

/** Request body for creating a category. Unknown fields are rejected. */
export const createCategorySchema = z.strictObject({
  name: categoryNameSchema,
  type: categoryTypeSchema,
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

/** Request body for updating a category. At least one field is required. */
export const updateCategorySchema = partialUpdateSchema({
  name: categoryNameSchema,
  type: categoryTypeSchema,
  isHidden: z.boolean(),
  sortOrder: z.int().nonnegative(),
});
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

/** The categories every new user starts with, in display order. */
export const DEFAULT_CATEGORIES: readonly CreateCategoryInput[] = [
  { name: "Rent/Housing", type: "essential" },
  { name: "Utilities", type: "essential" },
  { name: "Groceries", type: "essential" },
  { name: "Fuel", type: "essential" },
  { name: "Transportation", type: "essential" },
  { name: "Health", type: "essential" },
  { name: "Coffee", type: "discretionary" },
  { name: "Snacks & Drinks", type: "discretionary" },
  { name: "Dining Out", type: "discretionary" },
  { name: "Entertainment", type: "discretionary" },
  { name: "Shopping", type: "discretionary" },
  { name: "Other", type: "discretionary" },
];

/** A category, as the API returns it. */
export const categorySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  type: categoryTypeSchema,
  isHidden: z.boolean(),
  sortOrder: z.int(),
});
export type Category = z.infer<typeof categorySchema>;

/** The signed-in user's categories, in display order. */
export const categoryListSchema = z.object({
  categories: z.array(categorySchema),
});
export type CategoryList = z.infer<typeof categoryListSchema>;
