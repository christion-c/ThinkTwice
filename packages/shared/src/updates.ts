import * as z from "zod";

/** Returns true if the object has at least one field. */
function hasAnyField(fields: object): boolean {
  return Object.keys(fields).length > 0;
}

/** Builds an update schema: every field optional, unknown fields rejected, empty updates rejected. */
export function partialUpdateSchema<Shape extends z.ZodRawShape>(shape: Shape) {
  return z
    .strictObject(shape)
    .partial()
    .refine(hasAnyField, "Nothing to update.");
}
