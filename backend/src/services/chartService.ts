import { and, desc, eq, gte } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { chartEntries } from "../db/schema.js";
import { chartId } from "../lib/ids.js";

const UPLOADABLE_TYPES = new Set(["lab", "imaging"]);

export interface CreateChartEntryInput {
  patientId: string;
  entryType: string;
  summary: string;
  fullText: string;
  entryDate?: string;
  metadata?: Record<string, unknown>;
}

export async function createChartEntry(input: CreateChartEntryInput) {
  if (!UPLOADABLE_TYPES.has(input.entryType)) {
    throw new Error("Only lab and imaging chart entries can be uploaded");
  }

  const db = getDb();
  const id = chartId();
  const now = new Date().toISOString();
  const entryDate = input.entryDate ?? now.slice(0, 10);

  await db.insert(chartEntries).values({
    id,
    patientId: input.patientId,
    entryType: input.entryType,
    entryDate,
    summary: input.summary,
    fullText: input.fullText,
    metadata: input.metadata ?? null,
    createdAt: now,
  });

  const [created] = await db
    .select()
    .from(chartEntries)
    .where(eq(chartEntries.id, id))
    .limit(1);

  return created!;
}

const CLINICALLY_RELEVANT_TYPES = [
  "note",
  "imaging",
  "lab",
  "medication",
  "allergy",
  "procedure",
  "diagnosis",
];

/**
 * Returns chart entries for a patient within the given look-back window,
 * limited to clinically relevant entry types, sorted newest first.
 */
export async function getRelevantChartEntries(
  patientId: string,
  windowDays = 180
) {
  const db = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - windowDays);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  return db
    .select()
    .from(chartEntries)
    .where(
      and(
        eq(chartEntries.patientId, patientId),
        gte(chartEntries.entryDate, cutoffStr)
      )
    )
    .orderBy(desc(chartEntries.entryDate));
}

/**
 * Returns all chart entries for a patient (full history), sorted newest first.
 */
export async function getAllChartEntries(patientId: string) {
  const db = getDb();
  return db
    .select()
    .from(chartEntries)
    .where(eq(chartEntries.patientId, patientId))
    .orderBy(desc(chartEntries.entryDate));
}

/**
 * Checks if any chart entries are stale (all entries older than staleDays).
 */
export function checkStaleChart(
  entries: { entryDate: string }[],
  staleDays = 365
): boolean {
  if (entries.length === 0) return true;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - staleDays);
  const latest = entries[0];
  return new Date(latest.entryDate) < cutoff;
}
