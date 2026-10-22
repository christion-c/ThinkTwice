import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import * as z from "zod";

const healthResponseSchema = z.object({ status: z.literal("ok") });

/** Registers GET /health, which reports that the API is running. */
export const healthRoutes: FastifyPluginCallbackZod = (app, _options, done) => {
  app.get(
    "/health",
    {
      config: { public: true },
      schema: { response: { 200: healthResponseSchema } },
    },
    () => ({
      status: "ok" as const,
    }),
  );
  done();
};
