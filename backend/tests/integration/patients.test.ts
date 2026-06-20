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

describe("GET /api/v1/patients", () => {
  it("returns list of seeded patients", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/patients" });
    expect(res.statusCode).toBe(200);
    const body = res.json<Array<{ id: string; name: string }>>();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty("id");
    expect(body[0]).toHaveProperty("name");
  });

  it("filters patients by name search", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/patients?q=Test",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<Array<{ name: string }>>();
    expect(body.every((p) => p.name.includes("Test"))).toBe(true);
  });
});

describe("GET /api/v1/patients/:id", () => {
  it("returns a patient by id", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/patients/pat_test_001",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ id: string; name: string }>();
    expect(body.id).toBe("pat_test_001");
  });

  it("returns 404 for unknown patient", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/patients/pat_does_not_exist",
    });
    expect(res.statusCode).toBe(404);
  });
});

describe("GET /api/v1/patients/:id/chart-entries", () => {
  it("returns chart entries within window", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/patients/pat_test_001/chart-entries?windowDays=180",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ entries: unknown[] }>();
    expect(Array.isArray(body.entries)).toBe(true);
    expect(body.entries.length).toBeGreaterThan(0);
  });

  it("returns 404 for unknown patient", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/patients/pat_bad/chart-entries",
    });
    expect(res.statusCode).toBe(404);
  });
});
