import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import {
  aiPredictions,
  referralDraftContent,
  referralPatientPreferences,
  referralRejectionReasons,
  referrals,
} from "../db/schema.js";
import { genericId, referralId } from "../lib/ids.js";
import {
  assertTransition,
  type ReferralStatus,
  StatusTransitionError,
} from "../lib/referralStateMachine.js";
import { predictSpecialty } from "../adapters/ai/client.js";
import { getRelevantChartEntries, checkStaleChart } from "./chartService.js";

// ---------------------------------------------------------------------------
// Create referrals
// ---------------------------------------------------------------------------

export interface CreateManualReferralInput {
  patientId: string;
  specialty?: string;
  urgency?: string;
  demoPersona?: string;
  reason?: string;
  history?: string;
  medications?: string;
  allergies?: string;
  investigations?: string;
  notes?: string;
  additionalInstructions?: string;
  preferences?: {
    maxDistanceKm?: number;
    preferredSpecialistIds?: string[];
    excludedSpecialistIds?: string[];
    language?: string;
    timingNotes?: string;
    otherNotes?: string;
  };
}

export async function createManualReferral(input: CreateManualReferralInput) {
  const db = getDb();
  const id = referralId();
  const draftId = genericId();
  const prefId = genericId();
  const now = new Date().toISOString();

  await db.insert(referrals).values({
    id,
    patientId: input.patientId,
    status: "draft",
    specialty: input.specialty ?? null,
    urgency: input.urgency ?? "routine",
    demoPersona: input.demoPersona ?? "physician",
    additionalInstructions: input.additionalInstructions ?? null,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(referralDraftContent).values({
    id: draftId,
    referralId: id,
    reason: input.reason ?? null,
    history: input.history ?? null,
    medications: input.medications ?? null,
    allergies: input.allergies ?? null,
    investigations: input.investigations ?? null,
    notes: input.notes ?? null,
    isAiGenerated: false,
    updatedAt: now,
  });

  if (input.preferences) {
    await db.insert(referralPatientPreferences).values({
      id: prefId,
      referralId: id,
      maxDistanceKm: input.preferences.maxDistanceKm ?? null,
      preferredSpecialistIds: input.preferences.preferredSpecialistIds ?? null,
      excludedSpecialistIds: input.preferences.excludedSpecialistIds ?? null,
      language: input.preferences.language ?? null,
      timingNotes: input.preferences.timingNotes ?? null,
      otherNotes: input.preferences.otherNotes ?? null,
      updatedAt: now,
    });
  }

  return getReferralById(id);
}

export interface CreateAiReferralInput {
  patientId: string;
  urgency?: string;
  demoPersona?: string;
  chartWindowDays?: number;
  additionalInstructions?: string;
}

export async function createAiAssistedReferral(input: CreateAiReferralInput) {
  const db = getDb();
  const id = referralId();
  const draftId = genericId();
  const now = new Date().toISOString();

  // Load chart entries
  const entries = await getRelevantChartEntries(
    input.patientId,
    input.chartWindowDays ?? 180
  );

  const warnings: string[] = [];
  if (checkStaleChart(entries)) {
    warnings.push(
      "Chart data may be stale or incomplete. Review before sending."
    );
  }
  if (entries.length === 0) {
    warnings.push("No chart entries found within the selected time window.");
  }

  // Fetch prior rejection reasons for this patient (FR-017)
  const priorRejections = await db
    .select()
    .from(referralRejectionReasons)
    .innerJoin(referrals, eq(referralRejectionReasons.referralId, referrals.id))
    .where(eq(referrals.patientId, input.patientId))
    .orderBy(desc(referralRejectionReasons.createdAt))
    .limit(10);

  const rejectionFeedback = priorRejections.map((r) => ({
    reason: r.referral_rejection_reasons.reason,
    specialty: r.referrals.specialty,
    createdAt: r.referral_rejection_reasons.createdAt,
  }));

  const aiResult = await predictSpecialty({
    patientId: input.patientId,
    chartEntries: entries.map((e) => ({
      id: e.id,
      entryType: e.entryType,
      date: e.entryDate,
      text: e.fullText,
      summary: e.summary,
    })),
    rejectionFeedback,
    additionalInstructions: input.additionalInstructions,
  });

  const predId = genericId();
  const allWarnings = [...warnings, ...(aiResult.warnings ?? [])];

  await db.insert(referrals).values({
    id,
    patientId: input.patientId,
    status: "draft",
    specialty: aiResult.specialty,
    urgency: input.urgency ?? "routine",
    demoPersona: input.demoPersona ?? "physician",
    chartWindowDays: input.chartWindowDays ?? 180,
    additionalInstructions: input.additionalInstructions ?? null,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(aiPredictions).values({
    id: predId,
    referralId: id,
    specialty: aiResult.specialty,
    confidence: aiResult.confidence,
    rationale: aiResult.rationale,
    sourceChartEntryIds: aiResult.sourceChartEntryIds,
    warnings: allWarnings,
    modelLabel: aiResult.modelLabel,
    isFallback: aiResult.isFallback,
    createdAt: now,
  });

  const draft = aiResult.draftSections;
  await db.insert(referralDraftContent).values({
    id: draftId,
    referralId: id,
    reason: draft.reason ?? null,
    history: draft.history ?? null,
    medications: draft.medications ?? null,
    allergies: draft.allergies ?? null,
    investigations: draft.investigations ?? null,
    notes: draft.notes ?? null,
    isAiGenerated: !aiResult.isFallback,
    updatedAt: now,
  });

  return getReferralById(id);
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function getReferralById(id: string) {
  const db = getDb();

  const [referral] = await db
    .select()
    .from(referrals)
    .where(eq(referrals.id, id))
    .limit(1);

  if (!referral) return null;

  const [draft] = await db
    .select()
    .from(referralDraftContent)
    .where(eq(referralDraftContent.referralId, id))
    .limit(1);

  const [prefs] = await db
    .select()
    .from(referralPatientPreferences)
    .where(eq(referralPatientPreferences.referralId, id))
    .limit(1);

  const predictions = await db
    .select()
    .from(aiPredictions)
    .where(eq(aiPredictions.referralId, id))
    .orderBy(desc(aiPredictions.createdAt));

  const [rejection] = await db
    .select()
    .from(referralRejectionReasons)
    .where(eq(referralRejectionReasons.referralId, id))
    .orderBy(desc(referralRejectionReasons.createdAt))
    .limit(1);

  return {
    ...referral,
    draft: draft ?? null,
    preferences: prefs ?? null,
    latestPrediction: predictions[0] ?? null,
    rejectionReason: rejection ?? null,
  };
}

export async function listReferrals(filters: {
  patientId?: string;
  status?: string;
}) {
  const db = getDb();
  const conditions = [];
  if (filters.patientId) {
    conditions.push(eq(referrals.patientId, filters.patientId));
  }
  if (filters.status) {
    conditions.push(eq(referrals.status, filters.status));
  }

  return db
    .select()
    .from(referrals)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(referrals.createdAt));
}

// ---------------------------------------------------------------------------
// Update draft
// ---------------------------------------------------------------------------

export interface UpdateReferralInput {
  specialty?: string;
  urgency?: string;
  additionalInstructions?: string;
  draft?: {
    reason?: string;
    history?: string;
    medications?: string;
    allergies?: string;
    investigations?: string;
    notes?: string;
  };
  preferences?: {
    maxDistanceKm?: number;
    preferredSpecialistIds?: string[];
    excludedSpecialistIds?: string[];
    language?: string;
    timingNotes?: string;
    otherNotes?: string;
  };
}

export async function updateReferral(id: string, input: UpdateReferralInput) {
  const db = getDb();
  const now = new Date().toISOString();

  const referralUpdate: Record<string, unknown> = { updatedAt: now };
  if (input.specialty !== undefined) referralUpdate.specialty = input.specialty;
  if (input.urgency !== undefined) referralUpdate.urgency = input.urgency;
  if (input.additionalInstructions !== undefined)
    referralUpdate.additionalInstructions = input.additionalInstructions;

  await db.update(referrals).set(referralUpdate).where(eq(referrals.id, id));

  if (input.draft) {
    const draftUpdate: Record<string, unknown> = { updatedAt: now };
    for (const [k, v] of Object.entries(input.draft)) {
      draftUpdate[k] = v;
    }
    const existing = await db
      .select({ id: referralDraftContent.id })
      .from(referralDraftContent)
      .where(eq(referralDraftContent.referralId, id))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(referralDraftContent)
        .set(draftUpdate)
        .where(eq(referralDraftContent.referralId, id));
    } else {
      await db.insert(referralDraftContent).values({
        id: genericId(),
        referralId: id,
        ...draftUpdate,
        isAiGenerated: false,
      } as typeof referralDraftContent.$inferInsert);
    }
  }

  if (input.preferences) {
    const prefUpdate: Record<string, unknown> = { updatedAt: now };
    for (const [k, v] of Object.entries(input.preferences)) {
      prefUpdate[k] = v;
    }
    const existing = await db
      .select({ id: referralPatientPreferences.id })
      .from(referralPatientPreferences)
      .where(eq(referralPatientPreferences.referralId, id))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(referralPatientPreferences)
        .set(prefUpdate)
        .where(eq(referralPatientPreferences.referralId, id));
    } else {
      await db.insert(referralPatientPreferences).values({
        id: genericId(),
        referralId: id,
        ...prefUpdate,
      } as typeof referralPatientPreferences.$inferInsert);
    }
  }

  return getReferralById(id);
}

// ---------------------------------------------------------------------------
// Status transitions
// ---------------------------------------------------------------------------

export async function transitionReferralStatus(
  id: string,
  targetStatus: ReferralStatus,
  extra?: { specialistId?: string; rejectionReason?: string }
) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(referrals)
    .where(eq(referrals.id, id))
    .limit(1);

  if (!existing) {
    const err = new Error("Referral not found");
    (err as NodeJS.ErrnoException).code = "NOT_FOUND";
    throw err;
  }

  assertTransition(existing.status as ReferralStatus, targetStatus);

  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    status: targetStatus,
    updatedAt: now,
  };

  if (targetStatus === "selected_specialist" && extra?.specialistId) {
    update.assignedSpecialistId = extra.specialistId;
  }

  await db.update(referrals).set(update).where(eq(referrals.id, id));

  if (targetStatus === "rejected" && extra?.rejectionReason) {
    await db.insert(referralRejectionReasons).values({
      id: genericId(),
      referralId: id,
      reason: extra.rejectionReason,
      createdAt: now,
    });
  }

  return getReferralById(id);
}

// ---------------------------------------------------------------------------
// Re-run specialty prediction
// ---------------------------------------------------------------------------

export async function repredictSpecialty(referralId: string) {
  const db = getDb();
  const [referral] = await db
    .select()
    .from(referrals)
    .where(eq(referrals.id, referralId))
    .limit(1);

  if (!referral) return null;

  const entries = await getRelevantChartEntries(
    referral.patientId,
    referral.chartWindowDays ?? 180
  );

  const priorRejections = await db
    .select()
    .from(referralRejectionReasons)
    .innerJoin(referrals, eq(referralRejectionReasons.referralId, referrals.id))
    .where(eq(referrals.patientId, referral.patientId))
    .orderBy(desc(referralRejectionReasons.createdAt))
    .limit(10);

  const rejectionFeedback = priorRejections.map((r) => ({
    reason: r.referral_rejection_reasons.reason,
    specialty: r.referrals.specialty,
    createdAt: r.referral_rejection_reasons.createdAt,
  }));

  const aiResult = await predictSpecialty({
    patientId: referral.patientId,
    chartEntries: entries.map((e) => ({
      id: e.id,
      entryType: e.entryType,
      date: e.entryDate,
      text: e.fullText,
      summary: e.summary,
    })),
    rejectionFeedback,
    additionalInstructions: referral.additionalInstructions ?? undefined,
  });

  const predId = genericId();
  const now = new Date().toISOString();

  await db.insert(aiPredictions).values({
    id: predId,
    referralId,
    specialty: aiResult.specialty,
    confidence: aiResult.confidence,
    rationale: aiResult.rationale,
    sourceChartEntryIds: aiResult.sourceChartEntryIds,
    warnings: aiResult.warnings,
    modelLabel: aiResult.modelLabel,
    isFallback: aiResult.isFallback,
    createdAt: now,
  });

  // Update referral specialty if user hasn't manually overridden
  await db
    .update(referrals)
    .set({ specialty: aiResult.specialty, updatedAt: now })
    .where(eq(referrals.id, referralId));

  return getReferralById(referralId);
}
