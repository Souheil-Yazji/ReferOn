import type { FastifyInstance } from "fastify";
import { and, eq, like, or } from "drizzle-orm";
import { getDb } from "../db/client.js";
import {
  specialistAvailability,
  specialistLocations,
  specialists,
} from "../db/schema.js";
import { genericId, specialistId } from "../lib/ids.js";

interface RegisterBody {
  name: string;
  clinic: string;
  specialty: string;
  subspecialty?: string;
  gender?: string;
  contactEmail?: string;
  contactPhone?: string;
  caseTypes?: string[];
  referralTypes?: string[];
  procedures?: string[];
  acceptingReferrals?: boolean;
  locations?: {
    lat: number;
    lng: number;
    label?: string;
    address?: string;
  }[];
  availability?: {
    nextAvailableAt?: string;
    capacityNotes?: string;
  };
}

async function getSpecialistFull(id: string) {
  const db = getDb();
  const [spec] = await db
    .select()
    .from(specialists)
    .where(eq(specialists.id, id))
    .limit(1);

  if (!spec) return null;

  const locs = await db
    .select()
    .from(specialistLocations)
    .where(eq(specialistLocations.specialistId, id));

  const [avail] = await db
    .select()
    .from(specialistAvailability)
    .where(eq(specialistAvailability.specialistId, id))
    .limit(1);

  return { ...spec, locations: locs, availability: avail ?? null };
}

export async function specialistRoutes(app: FastifyInstance) {
  // POST /specialists/register
  app.post<{ Body: RegisterBody }>(
    "/specialists/register",
    async (req, reply) => {
      const body = req.body;
      if (!body?.name || !body?.clinic || !body?.specialty) {
        return reply.status(400).send({
          error: "VALIDATION",
          message: "name, clinic, and specialty are required",
        });
      }

      const db = getDb();
      const id = specialistId();
      const now = new Date().toISOString();

      await db.insert(specialists).values({
        id,
        name: body.name,
        clinic: body.clinic,
        specialty: body.specialty,
        subspecialty: body.subspecialty ?? null,
        gender: body.gender ?? null,
        contactEmail: body.contactEmail ?? null,
        contactPhone: body.contactPhone ?? null,
        acceptingReferrals: body.acceptingReferrals ?? true,
        caseTypes: body.caseTypes ?? null,
        referralTypes: body.referralTypes ?? null,
        procedures: body.procedures ?? null,
        createdAt: now,
        updatedAt: now,
      });

      if (body.locations?.length) {
        await db.insert(specialistLocations).values(
          body.locations.map((loc) => ({
            id: genericId(),
            specialistId: id,
            lat: loc.lat,
            lng: loc.lng,
            label: loc.label ?? null,
            address: loc.address ?? null,
          }))
        );
      }

      if (body.availability) {
        await db.insert(specialistAvailability).values({
          id: genericId(),
          specialistId: id,
          nextAvailableAt: body.availability.nextAvailableAt ?? null,
          capacityNotes: body.availability.capacityNotes ?? null,
          updatedAt: now,
        });
      }

      const result = await getSpecialistFull(id);
      return reply.status(201).send(result);
    }
  );

  // GET /specialists?specialty=&q=
  app.get<{ Querystring: { specialty?: string; q?: string } }>(
    "/specialists",
    async (req) => {
      const db = getDb();
      const { specialty, q } = req.query;
      const conditions = [];

      if (specialty) {
        conditions.push(
          or(
            eq(specialists.specialty, specialty),
            eq(specialists.subspecialty, specialty)
          )
        );
      }
      if (q) {
        conditions.push(
          or(
            like(specialists.name, `%${q}%`),
            like(specialists.clinic, `%${q}%`)
          )
        );
      }

      const rows = await db
        .select()
        .from(specialists)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return rows;
    }
  );

  // GET /specialists/:id
  app.get<{ Params: { id: string } }>(
    "/specialists/:id",
    async (req, reply) => {
      const result = await getSpecialistFull(req.params.id);
      if (!result)
        return reply
          .status(404)
          .send({ error: "NOT_FOUND", message: "Specialist not found" });
      return result;
    }
  );

  // PATCH /specialists/:id
  app.patch<{
    Params: { id: string };
    Body: Partial<RegisterBody>;
  }>("/specialists/:id", async (req, reply) => {
    const db = getDb();
    const { id } = req.params;
    const body = req.body;

    const [existing] = await db
      .select()
      .from(specialists)
      .where(eq(specialists.id, id))
      .limit(1);

    if (!existing)
      return reply
        .status(404)
        .send({ error: "NOT_FOUND", message: "Specialist not found" });

    const now = new Date().toISOString();
    const update: Record<string, unknown> = { updatedAt: now };

    for (const key of [
      "name",
      "clinic",
      "specialty",
      "subspecialty",
      "gender",
      "contactEmail",
      "contactPhone",
      "acceptingReferrals",
      "caseTypes",
      "referralTypes",
      "procedures",
    ] as const) {
      if (body[key] !== undefined) update[key] = body[key];
    }

    await db.update(specialists).set(update).where(eq(specialists.id, id));

    if (body.availability) {
      const [avail] = await db
        .select()
        .from(specialistAvailability)
        .where(eq(specialistAvailability.specialistId, id))
        .limit(1);

      if (avail) {
        await db
          .update(specialistAvailability)
          .set({
            nextAvailableAt: body.availability.nextAvailableAt ?? avail.nextAvailableAt,
            capacityNotes: body.availability.capacityNotes ?? avail.capacityNotes,
            updatedAt: now,
          })
          .where(eq(specialistAvailability.specialistId, id));
      } else {
        await db.insert(specialistAvailability).values({
          id: genericId(),
          specialistId: id,
          nextAvailableAt: body.availability.nextAvailableAt ?? null,
          capacityNotes: body.availability.capacityNotes ?? null,
          updatedAt: now,
        });
      }
    }

    return getSpecialistFull(id);
  });
}
