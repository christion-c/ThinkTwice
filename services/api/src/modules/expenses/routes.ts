// The signed-in user's expenses. Expense IDs that aren't theirs get the same 404 as IDs that don't exist.
import {
  createExpenseSchema,
  expenseListSchema,
  expenseSchema,
  listExpensesQuerySchema,
  updateExpenseSchema,
} from "@thinktwice/shared";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import * as z from "zod";

import { requireIdentity } from "../../plugins/auth.ts";
import {
  createExpense,
  deleteExpense,
  listExpenses,
  updateExpense,
} from "./service.ts";

const expenseParamsSchema = z.strictObject({ id: z.uuid() });

/** Registers GET and POST /expenses and PATCH and DELETE /expenses/:id. */
export const expenseRoutes: FastifyPluginCallbackZod = (
  app,
  _options,
  done,
) => {
  app.get(
    "/expenses",
    {
      schema: {
        querystring: listExpensesQuerySchema,
        response: { 200: expenseListSchema },
      },
    },
    async (request) => ({
      expenses: await listExpenses(
        app.db,
        requireIdentity(request).firebaseUid,
        request.query,
      ),
    }),
  );

  app.post(
    "/expenses",
    {
      schema: { body: createExpenseSchema, response: { 201: expenseSchema } },
    },
    async (request, reply) => {
      const expense = await createExpense(
        app.db,
        requireIdentity(request).firebaseUid,
        request.body,
      );
      return reply.code(201).send(expense);
    },
  );

  app.patch(
    "/expenses/:id",
    {
      schema: {
        params: expenseParamsSchema,
        body: updateExpenseSchema,
        response: { 200: expenseSchema },
      },
    },
    async (request) =>
      updateExpense(
        app.db,
        requireIdentity(request).firebaseUid,
        request.params.id,
        request.body,
      ),
  );

  app.delete(
    "/expenses/:id",
    { schema: { params: expenseParamsSchema } },
    async (request, reply) => {
      await deleteExpense(
        app.db,
        requireIdentity(request).firebaseUid,
        request.params.id,
      );
      return reply.code(204).send();
    },
  );

  done();
};
