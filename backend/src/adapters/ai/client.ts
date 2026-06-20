import { env } from "../../config/env.js";
import type {
  PredictSpecialtyRequest,
  PredictSpecialtyResponse,
} from "./types.js";
import { getFallbackPrediction } from "./fallback.js";

export interface PredictResult extends PredictSpecialtyResponse {
  isFallback: boolean;
}

export async function predictSpecialty(
  request: PredictSpecialtyRequest
): Promise<PredictResult> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    env.AI_TIMEOUT_MS
  );

  try {
    const response = await fetch(
      `${env.AI_SERVICE_URL}/v1/predict-specialty`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      throw new Error(`AI service responded with ${response.status}`);
    }

    const data = (await response.json()) as PredictSpecialtyResponse;
    return { ...data, isFallback: false };
  } catch (err) {
    const isAbort =
      err instanceof Error && err.name === "AbortError";
    console.warn(
      isAbort ? "AI service timed out; using fallback." : `AI service error: ${err}; using fallback.`
    );
    const sourceIds = request.chartEntries.map((e) => e.id);
    return getFallbackPrediction(request.patientId, sourceIds);
  } finally {
    clearTimeout(timeout);
  }
}
