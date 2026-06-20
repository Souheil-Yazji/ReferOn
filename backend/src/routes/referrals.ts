import type { FastifyInstance, FastifyReply } from "fastify";
import {
  createAiAssistedReferral,
  createManualReferral,
  getReferralById,
  listReferrals,
  repredictSpecialty,
  transitionReferralStatus,
  updateReferral,
} from "../services/referralService.js";
import { getSpecialistMatches } from "../services/matchingService.js";
import { StatusTransitionError } from "../lib/referralStateMachine.js";

export async function referralRoutes(app: FastifyInstance) {
  // GET /referrals?patientId=&status=
  app.get<{ Querystring: { patientId?: string; status?: string; specialistId?: string } }>(
    "/referrals",
    async (req) => {
      return listReferrals({
        patientId: req.query.patientId,
        status: req.query.status,
        specialistId: req.query.specialistId,
      });
    }
  );

  // POST /referrals — manual draft
  app.post<{ Body: Parameters<typeof createManualReferral>[0] }>(
    "/referrals",
    async (req, reply) => {
      if (!req.body?.patientId) {
        return reply.status(400).send({ error: "VALIDATION", message: "patientId is required" });
      }
      const referral = await createManualReferral(req.body);
      return reply.status(201).send(referral);
    }
  );

  // POST /referrals/from-chart — AI-assisted draft
  app.post<{ Body: Parameters<typeof createAiAssistedReferral>[0] }>(
    "/referrals/from-chart",
    async (req, reply) => {
      if (!req.body?.patientId) {
        return reply.status(400).send({ error: "VALIDATION", message: "patientId is required" });
      }
      const referral = await createAiAssistedReferral(req.body);
      return reply.status(201).send(referral);
    }
  );

  // GET /referrals/:id
  app.get<{ Params: { id: string } }>("/referrals/:id", async (req, reply) => {
    const referral = await getReferralById(req.params.id);
    if (!referral) return reply.status(404).send({ error: "NOT_FOUND", message: "Referral not found" });
    return referral;
  });

  // PATCH /referrals/:id
  app.patch<{
    Params: { id: string };
    Body: Parameters<typeof updateReferral>[1];
  }>("/referrals/:id", async (req, reply) => {
    const existing = await getReferralById(req.params.id);
    if (!existing) return reply.status(404).send({ error: "NOT_FOUND", message: "Referral not found" });
    return updateReferral(req.params.id, req.body);
  });

  // POST /referrals/:id/predict-specialty
  app.post<{ Params: { id: string } }>(
    "/referrals/:id/predict-specialty",
    async (req, reply) => {
      const result = await repredictSpecialty(req.params.id);
      if (!result) return reply.status(404).send({ error: "NOT_FOUND", message: "Referral not found" });
      return result;
    }
  );

  // POST /referrals/:id/preview
  app.post<{ Params: { id: string } }>(
    "/referrals/:id/preview",
    async (req, reply) => {
      try {
        return await transitionReferralStatus(req.params.id, "previewed");
      } catch (err) {
        return handleTransitionError(err, reply);
      }
    }
  );

  // POST /referrals/:id/select-specialist
  app.post<{
    Params: { id: string };
    Body: { specialistId: string };
  }>("/referrals/:id/select-specialist", async (req, reply) => {
    if (!req.body?.specialistId) {
      return reply.status(400).send({ error: "VALIDATION", message: "specialistId is required" });
    }
    try {
      return await transitionReferralStatus(
        req.params.id,
        "selected_specialist",
        { specialistId: req.body.specialistId }
      );
    } catch (err) {
      return handleTransitionError(err, reply);
    }
  });

  // POST /referrals/:id/send
  // Advances referral to "sent". If current status is selected_specialist,
  // automatically passes through "pending" first (POC simulated queue).
  app.post<{ Params: { id: string } }>(
    "/referrals/:id/send",
    async (req, reply) => {
      try {
        const current = await getReferralById(req.params.id);
        if (!current) return reply.status(404).send({ error: "NOT_FOUND", message: "Referral not found" });
        if (current.status === "selected_specialist") {
          await transitionReferralStatus(req.params.id, "pending");
        }
        return await transitionReferralStatus(req.params.id, "sent");
      } catch (err) {
        return handleTransitionError(err, reply);
      }
    }
  );

  // POST /referrals/:id/approve
  app.post<{ Params: { id: string } }>(
    "/referrals/:id/approve",
    async (req, reply) => {
      try {
        return await transitionReferralStatus(req.params.id, "approved");
      } catch (err) {
        return handleTransitionError(err, reply);
      }
    }
  );

  // POST /referrals/:id/reject
  app.post<{
    Params: { id: string };
    Body: { reason: string };
  }>("/referrals/:id/reject", async (req, reply) => {
    if (!req.body?.reason?.trim()) {
      return reply.status(400).send({
        error: "VALIDATION",
        message: "A rejection reason is required (FR-016).",
      });
    }
    try {
      return await transitionReferralStatus(req.params.id, "rejected", {
        rejectionReason: req.body.reason,
      });
    } catch (err) {
      return handleTransitionError(err, reply);
    }
  });

  // GET /referrals/:id/specialist-matches
  app.get<{ Params: { id: string } }>(
    "/referrals/:id/specialist-matches",
    async (req, reply) => {
      const referral = await getReferralById(req.params.id);
      if (!referral) return reply.status(404).send({ error: "NOT_FOUND", message: "Referral not found" });
      const matches = await getSpecialistMatches(req.params.id);
      return { referralId: req.params.id, matches };
    }
  );
}

function handleTransitionError(err: unknown, reply: FastifyReply) {
  if (err instanceof StatusTransitionError) {
    return reply.status(409).send({ error: "INVALID_TRANSITION", message: err.message });
  }
  if (
    err instanceof Error &&
    (err as NodeJS.ErrnoException).code === "NOT_FOUND"
  ) {
    return reply.status(404).send({ error: "NOT_FOUND", message: err.message });
  }
  throw err;
}
