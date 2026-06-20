import { describe, it, expect } from "vitest";
import {
  getFallbackPrediction,
  registerPatientScenario,
} from "../../src/adapters/ai/fallback.js";

describe("getFallbackPrediction", () => {
  it("returns orthopedic fallback for registered orthopedic patient", () => {
    registerPatientScenario("test_orth", "orthopedic");
    const result = getFallbackPrediction("test_orth", ["chart_001"]);
    expect(result.specialty).toBe("Orthopedic Surgery");
    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.isFallback).toBe(true);
  });

  it("returns cardiology fallback for registered cardiology patient", () => {
    registerPatientScenario("test_card", "cardiology");
    const result = getFallbackPrediction("test_card", []);
    expect(result.specialty).toBe("Cardiology");
    expect(result.isFallback).toBe(true);
  });

  it("always includes AI unavailable warning", () => {
    registerPatientScenario("test_amb", "ambiguous");
    const result = getFallbackPrediction("test_amb", []);
    expect(result.warnings.some((w) => /Live AI unavailable/i.test(w))).toBe(true);
  });

  it("uses supplied source chart entry IDs when provided", () => {
    registerPatientScenario("test_ids", "orthopedic");
    const ids = ["chart_a", "chart_b"];
    const result = getFallbackPrediction("test_ids", ids);
    expect(result.sourceChartEntryIds).toEqual(ids);
  });

  it("returns unknown fallback for unregistered patient", () => {
    const result = getFallbackPrediction("totally_unknown_patient", []);
    expect(result.confidence).toBeLessThan(0.5);
    expect(result.isFallback).toBe(true);
  });

  it("low-confidence result has required manual selection warning", () => {
    const result = getFallbackPrediction("totally_unknown_patient_2", []);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
