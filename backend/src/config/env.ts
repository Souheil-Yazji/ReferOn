import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().default("file:./data/referon.db"),
  AI_SERVICE_URL: z.string().url().default("http://localhost:8000"),
  AI_TIMEOUT_MS: z.coerce.number().default(30000),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().default("https://api.openai.com/v1"),
  OPENAI_REFERRAL_MODEL: z.string().default("gpt-5.5"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

function loadEnv() {
  // In tests we skip dotenv; in dev/prod we read process.env (populated by dotenv or shell)
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid environment variables:", result.error.flatten());
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
