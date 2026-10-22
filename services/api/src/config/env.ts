import * as z from "zod";

const LOG_LEVELS = [
  "fatal",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
  "silent",
] as const;

const booleanString = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  HOST: z.string().min(1).default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  LOG_LEVEL: z.enum(LOG_LEVELS).default("info"),
  CORS_ORIGINS: z
    .string()
    .default("")
    .transform((list) =>
      list
        .split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin !== ""),
    )
    .pipe(z.array(z.url())),
  TRUST_PROXY: booleanString.default(false),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  DATABASE_URL: z.url({
    protocol: /^postgres(ql)?$/,
    error: "DATABASE_URL must be a postgresql:// connection URL.",
  }),
});

export interface Config {
  nodeEnv: "development" | "test" | "production";
  host: string;
  port: number;
  logLevel: (typeof LOG_LEVELS)[number];
  corsOrigins: string[];
  trustProxy: boolean;
  rateLimitMax: number;
  databaseUrl: string;
}

/** Reads and validates the API's settings from environment variables, failing fast with a clear message. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    throw new Error(
      `Invalid environment configuration:\n${z.prettifyError(result.error)}`,
    );
  }
  const values = result.data;
  return {
    nodeEnv: values.NODE_ENV,
    host: values.HOST,
    port: values.PORT,
    logLevel: values.LOG_LEVEL,
    corsOrigins: values.CORS_ORIGINS,
    trustProxy: values.TRUST_PROXY,
    rateLimitMax: values.RATE_LIMIT_MAX,
    databaseUrl: values.DATABASE_URL,
  };
}
