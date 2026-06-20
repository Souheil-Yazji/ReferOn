import { sql } from "drizzle-orm";
import {
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

// ---------------------------------------------------------------------------
// Patients
// ---------------------------------------------------------------------------
export const patients = sqliteTable("patients", {
  id: text("id").primaryKey(), // pat_xxx
  name: text("name").notNull(),
  dob: text("dob").notNull(), // ISO date string
  sex: text("sex").notNull(), // 'male' | 'female' | 'other'
  addressSummary: text("address_summary"),
  lat: real("lat"),
  lng: real("lng"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ---------------------------------------------------------------------------
// Chart entries
// ---------------------------------------------------------------------------
export const chartEntries = sqliteTable("chart_entries", {
  id: text("id").primaryKey(), // chart_xxx
  patientId: text("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  entryType: text("entry_type").notNull(), // 'note' | 'imaging' | 'lab' | 'medication' | 'allergy'
  entryDate: text("entry_date").notNull(), // ISO date string
  summary: text("summary").notNull(),
  fullText: text("full_text").notNull(),
  metadata: text("metadata", { mode: "json" }), // extra structured data
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ---------------------------------------------------------------------------
// Referrals
// ---------------------------------------------------------------------------
export const referrals = sqliteTable("referrals", {
  id: text("id").primaryKey(), // ref_xxx
  patientId: text("patient_id")
    .notNull()
    .references(() => patients.id),
  status: text("status").notNull().default("draft"),
  // 'draft' | 'previewed' | 'selected_specialist' | 'pending' | 'sent' | 'approved' | 'rejected'
  specialty: text("specialty"), // AI-predicted or manually set
  urgency: text("urgency").notNull().default("routine"), // 'routine' | 'urgent' | 'emergent'
  demoPersona: text("demo_persona").notNull().default("physician"),
  assignedSpecialistId: text("assigned_specialist_id").references(
    () => specialists.id
  ),
  chartWindowDays: integer("chart_window_days").default(180),
  additionalInstructions: text("additional_instructions"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ---------------------------------------------------------------------------
// Referral draft content (one-to-one with referral)
// ---------------------------------------------------------------------------
export const referralDraftContent = sqliteTable("referral_draft_content", {
  id: text("id").primaryKey(),
  referralId: text("referral_id")
    .notNull()
    .unique()
    .references(() => referrals.id, { onDelete: "cascade" }),
  reason: text("reason"),
  history: text("history"),
  medications: text("medications"),
  allergies: text("allergies"),
  investigations: text("investigations"),
  notes: text("notes"),
  attachments: text("attachments", { mode: "json" }), // string[]
  isAiGenerated: integer("is_ai_generated", { mode: "boolean" })
    .notNull()
    .default(false),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ---------------------------------------------------------------------------
// Referral patient preferences (one-to-one)
// ---------------------------------------------------------------------------
export const referralPatientPreferences = sqliteTable(
  "referral_patient_preferences",
  {
    id: text("id").primaryKey(),
    referralId: text("referral_id")
      .notNull()
      .unique()
      .references(() => referrals.id, { onDelete: "cascade" }),
    maxDistanceKm: real("max_distance_km"),
    preferredSpecialistIds: text("preferred_specialist_ids", {
      mode: "json",
    }), // string[]
    excludedSpecialistIds: text("excluded_specialist_ids", {
      mode: "json",
    }), // string[]
    language: text("language"),
    timingNotes: text("timing_notes"),
    otherNotes: text("other_notes"),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  }
);

// ---------------------------------------------------------------------------
// AI predictions
// ---------------------------------------------------------------------------
export const aiPredictions = sqliteTable("ai_predictions", {
  id: text("id").primaryKey(),
  referralId: text("referral_id")
    .notNull()
    .references(() => referrals.id, { onDelete: "cascade" }),
  specialty: text("specialty").notNull(),
  confidence: real("confidence").notNull(),
  rationale: text("rationale").notNull(),
  sourceChartEntryIds: text("source_chart_entry_ids", { mode: "json" })
    .notNull()
    .$type<string[]>(),
  warnings: text("warnings", { mode: "json" }).$type<string[]>(),
  modelLabel: text("model_label"),
  isFallback: integer("is_fallback", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ---------------------------------------------------------------------------
// Referral rejection reasons
// ---------------------------------------------------------------------------
export const referralRejectionReasons = sqliteTable(
  "referral_rejection_reasons",
  {
    id: text("id").primaryKey(),
    referralId: text("referral_id")
      .notNull()
      .references(() => referrals.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  }
);

// ---------------------------------------------------------------------------
// Specialists
// ---------------------------------------------------------------------------
export const specialists = sqliteTable("specialists", {
  id: text("id").primaryKey(), // spec_xxx
  name: text("name").notNull(),
  clinic: text("clinic").notNull(),
  specialty: text("specialty").notNull(),
  subspecialty: text("subspecialty"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  acceptingReferrals: integer("accepting_referrals", { mode: "boolean" })
    .notNull()
    .default(true),
  caseTypes: text("case_types", { mode: "json" }).$type<string[]>(), // e.g. ['adult', 'pediatric']
  referralTypes: text("referral_types", { mode: "json" }).$type<string[]>(), // e.g. ['urgent', 'routine']
  procedures: text("procedures", { mode: "json" }).$type<string[]>(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ---------------------------------------------------------------------------
// Specialist locations
// ---------------------------------------------------------------------------
export const specialistLocations = sqliteTable("specialist_locations", {
  id: text("id").primaryKey(),
  specialistId: text("specialist_id")
    .notNull()
    .references(() => specialists.id, { onDelete: "cascade" }),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  label: text("label"), // 'main office', 'downtown clinic', etc.
  address: text("address"),
});

// ---------------------------------------------------------------------------
// Specialist availability
// ---------------------------------------------------------------------------
export const specialistAvailability = sqliteTable("specialist_availability", {
  id: text("id").primaryKey(),
  specialistId: text("specialist_id")
    .notNull()
    .references(() => specialists.id, { onDelete: "cascade" }),
  nextAvailableAt: text("next_available_at"), // ISO datetime string
  capacityNotes: text("capacity_notes"),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ---------------------------------------------------------------------------
// Type exports for use in services/routes
// ---------------------------------------------------------------------------
export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;
export type ChartEntry = typeof chartEntries.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type ReferralDraftContent = typeof referralDraftContent.$inferSelect;
export type ReferralPatientPreferences =
  typeof referralPatientPreferences.$inferSelect;
export type AiPrediction = typeof aiPredictions.$inferSelect;
export type ReferralRejectionReason =
  typeof referralRejectionReasons.$inferSelect;
export type Specialist = typeof specialists.$inferSelect;
export type SpecialistLocation = typeof specialistLocations.$inferSelect;
export type SpecialistAvailability = typeof specialistAvailability.$inferSelect;
