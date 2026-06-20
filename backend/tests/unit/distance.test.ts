import { describe, it, expect } from "vitest";
import { haversineKm } from "../../src/lib/distance.js";

describe("haversineKm", () => {
  it("returns 0 for identical coordinates", () => {
    expect(haversineKm(43.65, -79.38, 43.65, -79.38)).toBe(0);
  });

  it("calculates approximate Toronto to Scarborough distance", () => {
    // Union Station to Scarborough Town Centre, actual haversine ~17–18 km
    const dist = haversineKm(43.6453, -79.3806, 43.7742, -79.2573);
    expect(dist).toBeGreaterThan(15);
    expect(dist).toBeLessThan(25);
  });

  it("is symmetric (A→B equals B→A)", () => {
    const d1 = haversineKm(43.65, -79.38, 43.72, -79.45);
    const d2 = haversineKm(43.72, -79.45, 43.65, -79.38);
    expect(Math.abs(d1 - d2)).toBeLessThan(0.0001);
  });

  it("gives reasonable cross-city result (Toronto to Hamilton ~60 km)", () => {
    const dist = haversineKm(43.6532, -79.3832, 43.2557, -79.8711);
    expect(dist).toBeGreaterThan(55);
    expect(dist).toBeLessThan(80);
  });
});
