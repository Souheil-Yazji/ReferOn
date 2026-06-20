import { z } from "zod";
import { env } from "../../config/env.js";
import type {
  AiDraftSections,
  PredictSpecialtyRequest,
  PredictSpecialtyResponse,
} from "./types.js";
import {
  buildReferralGenerationInput,
  REFERRAL_PROMPT_VERSION,
} from "./prompt.js";

const OPENAI_RESPONSE_SCHEMA_NAME = "referon_referral_generation";

export const openAIReferralResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "specialty",
    "confidence",
    "rationale",
    "sourceChartEntryIds",
    "warnings",
    "draftSections",
    "modelLabel",
  ],
  properties: {
    specialty: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    rationale: { type: "string" },
    sourceChartEntryIds: {
      type: "array",
      items: { type: "string" },
    },
    warnings: {
      type: "array",
      items: { type: "string" },
    },
    draftSections: {
      type: "object",
      additionalProperties: false,
      required: [
        "reason",
        "history",
        "medications",
        "allergies",
        "investigations",
        "notes",
      ],
      properties: {
        reason: { type: ["string", "null"] },
        history: { type: ["string", "null"] },
        medications: { type: ["string", "null"] },
        allergies: { type: ["string", "null"] },
        investigations: { type: ["string", "null"] },
        notes: { type: ["string", "null"] },
      },
    },
    modelLabel: { type: "string" },
  },
} as const;

const openAIPredictionSchema = z.object({
  specialty: z.string(),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
  sourceChartEntryIds: z.array(z.string()),
  warnings: z.array(z.string()),
  draftSections: z.object({
    reason: z.string().nullable().optional(),
    history: z.string().nullable().optional(),
    medications: z.string().nullable().optional(),
    allergies: z.string().nullable().optional(),
    investigations: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
  }),
  modelLabel: z.string(),
});

type OpenAIResponsesPayload = {
  id?: string;
  model?: string;
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

export function buildOpenAIReferralRequest(request: PredictSpecialtyRequest) {
  return {
    model: env.OPENAI_REFERRAL_MODEL,
    input: buildReferralGenerationInput(request),
    text: {
      format: {
        type: "json_schema",
        name: OPENAI_RESPONSE_SCHEMA_NAME,
        strict: true,
        schema: openAIReferralResponseJsonSchema,
      },
    },
  };
}

export async function predictSpecialtyWithOpenAI(
  request: PredictSpecialtyRequest,
  signal: AbortSignal
): Promise<PredictSpecialtyResponse> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch(`${env.OPENAI_BASE_URL}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildOpenAIReferralRequest(request)),
    signal,
  });

  const payload = (await response.json()) as OpenAIResponsesPayload;
  if (!response.ok) {
    throw new Error(`OpenAI responded with ${response.status}`);
  }

  return parseOpenAIPredictionResponse(payload);
}

export function parseOpenAIPredictionResponse(
  payload: OpenAIResponsesPayload
): PredictSpecialtyResponse {
  const outputText = extractOpenAIOutputText(payload);
  if (!outputText) {
    throw new Error("OpenAI response did not include output text");
  }

  const parsed = openAIPredictionSchema.parse(JSON.parse(outputText));
  return {
    ...parsed,
    draftSections: normalizeDraftSections(parsed.draftSections),
    modelLabel: parsed.modelLabel || `${env.OPENAI_REFERRAL_MODEL}:${REFERRAL_PROMPT_VERSION}`,
  };
}

export function extractOpenAIOutputText(payload: OpenAIResponsesPayload) {
  if (typeof payload.output_text === "string") {
    return payload.output_text;
  }

  const textParts: string[] = [];
  for (const item of payload.output ?? []) {
    for (const part of item.content ?? []) {
      if (
        typeof part.text === "string" &&
        (part.type === "output_text" || part.type === "text")
      ) {
        textParts.push(part.text);
      }
    }
  }

  return textParts.length > 0 ? textParts.join("") : null;
}

function normalizeDraftSections(
  draftSections: z.infer<typeof openAIPredictionSchema>["draftSections"]
): AiDraftSections {
  return Object.fromEntries(
    Object.entries(draftSections).filter(([, value]) => value !== null)
  ) as AiDraftSections;
}
