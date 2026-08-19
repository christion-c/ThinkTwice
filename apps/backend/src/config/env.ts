import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Coerced from a string since process.env values are always strings.
  PORT: z.coerce.number().int().positive().default(3000),

  // No default - the app must not start without a real database.
  DATABASE_URL: z.string().min(1),

  // Shared secret for service-to-service routes (e.g. the ML service
  // fetching another user's fill-up history). Not a Firebase user token.
  INTERNAL_SERVICE_TOKEN: z.string().min(1),

  // Defaults to the Docker Compose service name; overridden in production.
  ML_SERVICE_URL: z
    .string()
    .url()
    .default("http://ml:8000"),

  // "*" allows any origin; production sets this to the real frontend origin(s).
  CORS_ORIGIN: z.string().default("*"),
});

// Validate once at startup rather than trusting process.env directly
// everywhere it's read.
const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  console.error(
    "Invalid environment configuration:",
    parsedEnvironment.error.flatten().fieldErrors,
  );

  // Fail fast rather than let the app run with bad config.
  throw new Error("Application environment is invalid.");
}

export const env = parsedEnvironment.data;