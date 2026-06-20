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

describe("POST /api/v1/specialists/register", () => {
  let specialistId: string;

  it("registers a new specialist with location and availability", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/specialists/register",
      payload: {
        name: "Dr. New Specialist",
        clinic: "Test Clinic",
        specialty: "Orthopedic Surgery",
        subspecialty: "Knee Replacement",
        contactEmail: "new@test.ca",
        acceptingReferrals: true,
        caseTypes: ["adult"],
        referralTypes: ["routine"],
        procedures: ["total knee arthroplasty"],
        locations: [
          {
            lat: 43.66,
            lng: -79.40,
            label: "Main Office",
            address: "500 Test Rd, Toronto, ON",
          },
        ],
        availability: {
          nextAvailableAt: "2026-08-01T09:00:00Z",
          capacityNotes: "Accepting new patients",
        },
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json<{
      id: string;
      name: string;
      locations: unknown[];
      availability: { nextAvailableAt: string } | null;
    }>();
    expect(body.id).toMatch(/^spec_/);
    expect(body.name).toBe("Dr. New Specialist");
    expect(body.locations.length).toBe(1);
    expect(body.availability?.nextAvailableAt).toBe("2026-08-01T09:00:00Z");
    specialistId = body.id;
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/specialists/register",
      payload: { name: "No Clinic" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("PATCH /specialists/:id updates accepting_referrals flag", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/v1/specialists/${specialistId}`,
      payload: {
        acceptingReferrals: false,
        availability: { capacityNotes: "Full until September" },
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{
      acceptingReferrals: boolean;
      availability: { capacityNotes: string } | null;
    }>();
    expect(body.acceptingReferrals).toBe(false);
    expect(body.availability?.capacityNotes).toBe("Full until September");
  });
});

describe("GET /api/v1/specialists", () => {
  it("returns all specialists without filter", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/specialists",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<unknown[]>();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  it("filters by specialty", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/specialists?specialty=Orthopedic+Surgery",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<Array<{ specialty: string }>>();
    expect(
      body.every((s) => s.specialty === "Orthopedic Surgery")
    ).toBe(true);
  });
});

describe("GET /api/v1/specialists/:id", () => {
  it("returns full specialist profile", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/specialists/spec_test_001",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{
      id: string;
      locations: unknown[];
      availability: unknown;
    }>();
    expect(body.id).toBe("spec_test_001");
    expect(body.locations.length).toBeGreaterThan(0);
  });

  it("returns 404 for unknown specialist", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/specialists/spec_does_not_exist",
    });
    expect(res.statusCode).toBe(404);
  });
});
