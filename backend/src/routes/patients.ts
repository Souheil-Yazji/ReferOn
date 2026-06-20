import type { FastifyInstance } from "fastify";
import { like, eq, or } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { patients } from "../db/schema.js";
import {
  getAllChartEntries,
  getRelevantChartEntries,
} from "../services/chartService.js";

export async function patientRoutes(app: FastifyInstance) {
  // GET /patients?q=
  app.get<{ Querystring: { q?: string } }>("/patients", async (req) => {
    const db = getDb();
    const { q } = req.query;

    if (q) {
      return db
        .select()
        .from(patients)
        .where(like(patients.name, `%${q}%`));
    }
    return db.select().from(patients);
  });

  // GET /patients/:id
  app.get<{ Params: { id: string } }>("/patients/:id", async (req, reply) => {
    const db = getDb();
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, req.params.id))
      .limit(1);

    if (!patient) {
      return reply.status(404).send({ error: "NOT_FOUND", message: "Patient not found" });
    }
    return patient;
  });

  // GET /patients/:id/chart-entries?windowDays=180
  app.get<{
    Params: { id: string };
    Querystring: { windowDays?: string; all?: string };
  }>("/patients/:id/chart-entries", async (req, reply) => {
    const db = getDb();
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, req.params.id))
      .limit(1);

    if (!patient) {
      return reply.status(404).send({ error: "NOT_FOUND", message: "Patient not found" });
    }

    const windowDays = req.query.windowDays
      ? parseInt(req.query.windowDays, 10)
      : 180;

    const entries =
      req.query.all === "true"
        ? await getAllChartEntries(req.params.id)
        : await getRelevantChartEntries(req.params.id, windowDays);

    return { patientId: req.params.id, windowDays, entries };
  });
}
