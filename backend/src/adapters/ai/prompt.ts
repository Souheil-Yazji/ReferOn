import type { PredictSpecialtyRequest } from "./types.js";

export const REFERRAL_PROMPT_VERSION = "referon-referral-generation-v1";

const DEVELOPER_INSTRUCTIONS = `You are ReferOn's referral generation assistant for a proof-of-concept medical referral workflow.

Return one structured JSON object matching the supplied schema. Generate both the relevant chart summary for referral drafting and the likely specialty recommendation in the same response.

Rules:
- Do not diagnose the patient.
- Do not invent facts that are not present in the supplied chart entries.
- Cite source chart entry IDs for clinically relevant claims.
- Use empty arrays when information is unavailable.
- Keep draft sections concise and editable.
- Treat confidence as a demonstration score from 0 to 1, not clinical certainty.
- Flag missing data that would matter to a real referral.
- If rejection feedback is supplied, use it to avoid repeating prior referral drafting or routing issues.`;

export function buildReferralGenerationInput(request: PredictSpecialtyRequest) {
  return [
    {
      role: "developer",
      content: [
        {
          type: "input_text",
          text: DEVELOPER_INSTRUCTIONS,
        },
      ],
    },
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: `Create a referral analysis from this JSON payload:\n${JSON.stringify(
            {
              promptVersion: REFERRAL_PROMPT_VERSION,
              ...request,
            },
            null,
            2
          )}`,
        },
      ],
    },
  ];
}
