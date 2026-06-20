import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { createTestApp } from "./helpers.js";

let app: FastifyInstance;

beforeAll(async () => {
  app = await createTestApp();
});

afterAll(async () => {
  await app.close();
});

describe("Referral lifecycle — manual path", () => {
  let referralId: string;

  it("POST /api/v1/referrals creates a draft referral", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/referrals",
      payload: {
        patientId: "pat_test_001",
        specialty: "Orthopedic Surgery",
        urgency: "routine",
        reason: "Persistent knee pain, conservative management failed.",
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{ id: string; status: string }>();
    expect(body.status).toBe("draft");
    expect(body.id).toMatch(/^ref_/);
    referralId = body.id;
  });

  it("GET /api/v1/referrals/:id returns full referral aggregate", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/referrals/${referralId}`,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ id: string; draft: { reason: string } | null }>();
    expect(body.draft?.reason).toBe(
      "Persistent knee pain, conservative management failed."
    );
  });

  it("PATCH /api/v1/referrals/:id updates draft fields and preferences", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/v1/referrals/${referralId}`,
      payload: {
        draft: { notes: "Patient prefers surgical consultation." },
        preferences: { maxDistanceKm: 25, language: "English" },
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{
      draft: { notes: string };
      preferences: { maxDistanceKm: number };
    }>();
    expect(body.draft?.notes).toBe("Patient prefers surgical consultation.");
    expect(body.preferences?.maxDistanceKm).toBe(25);
  });

  it("POST .../preview transitions to previewed", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/referrals/${referralId}/preview`,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ status: string }>();
    expect(body.status).toBe("previewed");
  });

  it("GET .../specialist-matches returns ranked matches", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/referrals/${referralId}/specialist-matches`,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{
      matches: Array<{ specialist: { name: string }; score: number }>;
    }>();
    expect(body.matches.length).toBeGreaterThan(0);
    // First match should have highest or equal score
    const scores = body.matches.map((m) => m.score);
    expect(scores[0]).toBeGreaterThanOrEqual(scores[scores.length - 1]);
  });

  it("POST .../select-specialist transitions to selected_specialist", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/referrals/${referralId}/select-specialist`,
      payload: { specialistId: "spec_test_001" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{
      status: string;
      assignedSpecialistId: string;
    }>();
    expect(body.status).toBe("selected_specialist");
    expect(body.assignedSpecialistId).toBe("spec_test_001");
  });

  it("POST .../send auto-advances selected_specialist → pending → sent", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/referrals/${referralId}/send`,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ status: string }>();
    expect(body.status).toBe("sent");
  });

  it("POST .../reject requires and stores a reason", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/referrals/${referralId}/reject`,
      payload: { reason: "Missing recent imaging report." },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{
      status: string;
      rejectionReason: { reason: string };
    }>();
    expect(body.status).toBe("rejected");
    expect(body.rejectionReason?.reason).toBe("Missing recent imaging report.");
  });
});

describe("Rejection reason validation (FR-016)", () => {
  it("POST .../reject without reason returns 400", async () => {
    const create = await app.inject({
      method: "POST",
      url: "/api/v1/referrals",
      payload: { patientId: "pat_test_001" },
    });
    const id = create.json<{ id: string }>().id;
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/referrals/${id}/reject`,
      payload: {},
    });
    expect(res.statusCode).toBe(400);
    expect(res.json<{ error: string }>().error).toBe("VALIDATION");
  });
});

describe("GET /api/v1/referrals", () => {
  it("lists referrals with patientId filter", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/referrals?patientId=pat_test_001",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<Array<{ patientId: string }>>();
    expect(Array.isArray(body)).toBe(true);
    expect(body.every((r) => r.patientId === "pat_test_001")).toBe(true);
  });
});

describe("Invalid transitions return 409", () => {
  it("draft → approve is rejected with INVALID_TRANSITION", async () => {
    const create = await app.inject({
      method: "POST",
      url: "/api/v1/referrals",
      payload: { patientId: "pat_test_001" },
    });
    const id = create.json<{ id: string }>().id;
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/referrals/${id}/approve`,
    });
    expect(res.statusCode).toBe(409);
    expect(res.json<{ error: string }>().error).toBe("INVALID_TRANSITION");
  });
});

describe("Gender preference filtering", () => {
  it("returns only specialists matching preferred gender", async () => {
    const create = await app.inject({
      method: "POST",
      url: "/api/v1/referrals",
      payload: {
        patientId: "pat_test_001",
        specialty: "Orthopedic Surgery",
      },
    });
    const id = create.json<{ id: string }>().id;

    await app.inject({
      method: "PATCH",
      url: `/api/v1/referrals/${id}`,
      payload: { preferences: { gender: "male" } },
    });

    const res = await app.inject({
      method: "GET",
      url: `/api/v1/referrals/${id}/specialist-matches`,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{
      matches: Array<{ specialist: { id: string; gender: string | null } }>;
    }>();
    expect(body.matches.length).toBeGreaterThan(0);
    expect(body.matches.every((m) => m.specialist.gender === "male")).toBe(true);
    expect(body.matches.some((m) => m.specialist.id === "spec_test_002")).toBe(
      false
    );
  });
});

describe("404 handling", () => {
  it("GET unknown referral returns 404", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/referrals/ref_does_not_exist",
    });
    expect(res.statusCode).toBe(404);
  });
});
