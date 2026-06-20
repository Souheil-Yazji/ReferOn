import type { FastifyInstance } from "fastify";
import { runSeed } from "../db/seed/run.js";

export async function demoRoutes(app: FastifyInstance) {
  // POST /demo/reset
  app.post("/demo/reset", async (_req, reply) => {
    try {
      const result = await runSeed({ truncate: true });
      return reply.status(200).send({
        success: true,
        message: "Demo data has been reset.",
        summary: result,
      });
    } catch (err) {
      app.log.error(err, "Demo reset failed");
      return reply.status(500).send({
        error: "RESET_FAILED",
        message: "Failed to reset demo data. Check server logs.",
      });
    }
  });
}
