import * as z from "zod";

/** Largest amount accepted for a single expense or budget: $100,000.00. */
export const MAX_AMOUNT_CENTS = 10_000_000;

/** A positive whole number of US cents, capped at MAX_AMOUNT_CENTS. */
export const amountCentsSchema = z
  .int("Amount must be a whole number of cents.")
  .positive("Amount must be more than $0.")
  .max(MAX_AMOUNT_CENTS, "Amount can't be more than $100,000.");
