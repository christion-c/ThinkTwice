// The signed-in user's categories. Category IDs that aren't theirs get the same 404 as IDs that don't exist.
import {
  categoryListSchema,
  categorySchema,
  createCategorySchema,
  updateCategorySchema,
} from "@thinktwice/shared";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import * as z from "zod";

import { requireIdentity } from "../../plugins/auth.ts";
import { createCategory, listCategories, updateCategory } from "./service.ts";

const categoryParamsSchema = z.strictObject({ id: z.uuid() });

/** Registers GET and POST /categories and PATCH /categories/:id. */
export const categoryRoutes: FastifyPluginCallbackZod = (
  app,
  _options,
  done,
) => {
  app.get(
    "/categories",
    { schema: { response: { 200: categoryListSchema } } },
    async (request) => ({
      categories: await listCategories(
        app.db,
        requireIdentity(request).firebaseUid,
      ),
    }),
  );

  app.post(
    "/categories",
    {
      schema: {
        body: createCategorySchema,
        response: { 201: categorySchema },
      },
    },
    async (request, reply) => {
      const category = await createCategory(
        app.db,
        requireIdentity(request).firebaseUid,
        request.body,
      );
      return reply.code(201).send(category);
    },
  );

  app.patch(
    "/categories/:id",
    {
      schema: {
        params: categoryParamsSchema,
        body: updateCategorySchema,
        response: { 200: categorySchema },
      },
    },
    async (request) =>
      updateCategory(
        app.db,
        requireIdentity(request).firebaseUid,
        request.params.id,
        request.body,
      ),
  );

  done();
};
