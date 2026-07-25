import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().min(1),

  ML_SERVICE_URL: z
    .string()
    .url()
    .default("http://ml:8000"),

  CORS_ORIGIN: z.string().default("*"),
});

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  console.error(
    "Invalid environment configuration:",
    parsedEnvironment.error.flatten().fieldErrors,
  );

  throw new Error("Application environment is invalid.");
}

export const env = parsedEnvironment.data;