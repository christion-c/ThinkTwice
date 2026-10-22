// The signed-in user's own account. There are no user IDs in these URLs: "me" always means the caller.
import {
  createAccountSchema,
  updateUserSettingsSchema,
  userProfileSchema,
} from "@thinktwice/shared";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";

import { requireIdentity } from "../../plugins/auth.ts";
import {
  createAccount,
  deleteAccount,
  getProfile,
  updateSettings,
} from "./service.ts";

/** Registers GET, POST, PATCH and DELETE /me. */
export const userRoutes: FastifyPluginCallbackZod = (app, _options, done) => {
  app.get(
    "/me",
    { schema: { response: { 200: userProfileSchema } } },
    async (request) => getProfile(app.db, requireIdentity(request).firebaseUid),
  );

  app.post(
    "/me",
    {
      schema: {
        body: createAccountSchema,
        response: { 200: userProfileSchema, 201: userProfileSchema },
      },
    },
    async (request, reply) => {
      const { profile, created } = await createAccount(
        app.db,
        requireIdentity(request),
        request.body.timezone,
      );
      return reply.code(created ? 201 : 200).send(profile);
    },
  );

  app.patch(
    "/me",
    {
      schema: {
        body: updateUserSettingsSchema,
        response: { 200: userProfileSchema },
      },
    },
    async (request) =>
      updateSettings(
        app.db,
        requireIdentity(request).firebaseUid,
        request.body,
      ),
  );

  app.delete("/me", async (request, reply) => {
    await deleteAccount(app.db, requireIdentity(request).firebaseUid);
    return reply.code(204).send();
  });

  done();
};
