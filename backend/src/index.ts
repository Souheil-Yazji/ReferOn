import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./config/env.js";
import { patientRoutes } from "./routes/patients.js";
import { referralRoutes } from "./routes/referrals.js";
import { specialistRoutes } from "./routes/specialists.js";
import { demoRoutes } from "./routes/demo.js";

export async function buildApp() {
  const app = Fastify({
    logger:
      env.NODE_ENV === "development"
        ? { level: "info", transport: { target: "pino-pretty", options: { colorize: true } } }
        : { level: "info" },
  });

  // CORS for local frontend development
  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  });

  // Health check (no prefix)
  app.get("/health", async () => ({
    status: "ok",
    env: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  }));

  // All API routes under /api/v1
  await app.register(
    async (api) => {
      await api.register(patientRoutes);
      await api.register(referralRoutes);
      await api.register(specialistRoutes);
      await api.register(demoRoutes);
    },
    { prefix: "/api/v1" }
  );

  return app;
}

async function start() {
  const app = await buildApp();
  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
