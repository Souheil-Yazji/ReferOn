import { describe, expect, it } from "vitest";
import {
  buildOpenAIReferralRequest,
  extractOpenAIOutputText,
  parseOpenAIPredictionResponse,
} from "../../src/adapters/ai/openai.js";

const validPrediction = {
  specialty: "Orthopedic Surgery",
  confidence: 0.82,
  rationale:
    "Chart entries show persistent knee pain, failed conservative management, and relevant imaging.",
  sourceChartEntryIds: ["chart_001", "chart_002"],
  warnings: [],
  draftSections: {
    reason: "Persistent knee pain with abnormal imaging.",
    history: "Ongoing knee pain despite conservative treatment.",
    medications: "Naproxen as needed.",
    allergies: null,
    investigations: "Knee x-ray showed degenerative changes.",
    notes: "Patient prefers surgical consultation.",
  },
  modelLabel: "referon-openai-test",
};

describe("OpenAI referral adapter helpers", () => {
  it("builds a strict structured output request", () => {
    const request = buildOpenAIReferralRequest({
      patientId: "pat_001",
      chartEntries: [
        {
          id: "chart_001",
          entryType: "note",
          date: "2026-06-01",
          text: "Persistent knee pain.",
          summary: "Knee pain visit",
        },
      ],
      rejectionFeedback: [],
      additionalInstructions: "Use recent imaging.",
    });

    expect(request.text.format.type).toBe("json_schema");
    expect(request.text.format.strict).toBe(true);
    expect(JSON.stringify(request.input)).toContain("chart_001");
    expect(JSON.stringify(request.input)).toContain("Use recent imaging.");
  });

  it("extracts text from supported Responses API payload shapes", () => {
    expect(extractOpenAIOutputText({ output_text: "{\"ok\":true}" })).toBe(
      "{\"ok\":true}"
    );
    expect(
      extractOpenAIOutputText({
        output: [
          {
            content: [{ type: "output_text", text: "{\"ok\":true}" }],
          },
        ],
      })
    ).toBe("{\"ok\":true}");
  });

  it("parses and normalizes a valid structured prediction", () => {
    const result = parseOpenAIPredictionResponse({
      output_text: JSON.stringify(validPrediction),
    });

    expect(result.specialty).toBe("Orthopedic Surgery");
    expect(result.draftSections.allergies).toBeUndefined();
    expect(result.sourceChartEntryIds).toEqual(["chart_001", "chart_002"]);
  });

  it("rejects malformed structured prediction output", () => {
    expect(() =>
      parseOpenAIPredictionResponse({ output_text: JSON.stringify({ specialty: "Cardiology" }) })
    ).toThrow();
  });
});
