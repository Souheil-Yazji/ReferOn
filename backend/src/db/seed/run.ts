import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "../schema.js";
import {
  patients,
  chartEntries,
  specialists,
  specialistLocations,
  specialistAvailability,
  referrals,
  referralDraftContent,
  referralPatientPreferences,
  aiPredictions,
  referralRejectionReasons,
} from "../schema.js";
import { genericId } from "../../lib/ids.js";
import { registerPatientScenario } from "../../adapters/ai/fallback.js";

// Import JSON fixtures
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const patientFixtures = require("./patients.json") as Array<{
  id: string;
  name: string;
  dob: string;
  sex: string;
  addressSummary: string;
  lat: number;
  lng: number;
  scenario: "orthopedic" | "cardiology" | "ambiguous";
}>;
const chartFixtures = require("./chart_entries.json") as Array<{
  id: string;
  patientId: string;
  entryType: string;
  entryDate: string;
  summary: string;
  fullText: string;
}>;
const specialistFixtures = require("./specialists.json") as Array<{
  id: string;
  name: string;
  clinic: string;
  specialty: string;
  subspecialty: string | null;
  contactEmail: string;
  contactPhone: string;
  acceptingReferrals: boolean;
  caseTypes: string[];
  referralTypes: string[];
  procedures: string[];
  locations: { lat: number; lng: number; label: string; address: string }[];
  availability: { nextAvailableAt: string; capacityNotes: string };
}>;

function getDbUrl(): string {
  return process.env.DATABASE_URL ?? "file:./data/referon.db";
}

export async function runSeed(options: { truncate?: boolean } = {}) {
  const url = getDbUrl();
  const client = createClient({ url });
  const db = drizzle(client, { schema });

  // Run migrations first to ensure tables exist
  await migrate(db, { migrationsFolder: "./drizzle" });

  if (options.truncate) {
    // Clear in dependency order
    await db.delete(referralRejectionReasons);
    await db.delete(aiPredictions);
    await db.delete(referralPatientPreferences);
    await db.delete(referralDraftContent);
    await db.delete(referrals);
    await db.delete(specialistAvailability);
    await db.delete(specialistLocations);
    await db.delete(specialists);
    await db.delete(chartEntries);
    await db.delete(patients);
  }

  const now = new Date().toISOString();

  // Patients
  for (const p of patientFixtures) {
    await db
      .insert(patients)
      .values({
        id: p.id,
        name: p.name,
        dob: p.dob,
        sex: p.sex,
        addressSummary: p.addressSummary,
        lat: p.lat,
        lng: p.lng,
        createdAt: now,
      })
      .onConflictDoNothing();

    // Register patient scenario for AI fallback
    registerPatientScenario(p.id, p.scenario);
  }

  // Chart entries
  for (const c of chartFixtures) {
    await db
      .insert(chartEntries)
      .values({
        id: c.id,
        patientId: c.patientId,
        entryType: c.entryType,
        entryDate: c.entryDate,
        summary: c.summary,
        fullText: c.fullText,
        createdAt: now,
      })
      .onConflictDoNothing();
  }

  // Specialists + locations + availability
  for (const s of specialistFixtures) {
    await db
      .insert(specialists)
      .values({
        id: s.id,
        name: s.name,
        clinic: s.clinic,
        specialty: s.specialty,
        subspecialty: s.subspecialty,
        contactEmail: s.contactEmail,
        contactPhone: s.contactPhone,
        acceptingReferrals: s.acceptingReferrals,
        caseTypes: s.caseTypes,
        referralTypes: s.referralTypes,
        procedures: s.procedures,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();

    for (const loc of s.locations ?? []) {
      await db
        .insert(specialistLocations)
        .values({
          id: genericId(),
          specialistId: s.id,
          lat: loc.lat,
          lng: loc.lng,
          label: loc.label,
          address: loc.address,
        })
        .onConflictDoNothing();
    }

    if (s.availability) {
      await db
        .insert(specialistAvailability)
        .values({
          id: genericId(),
          specialistId: s.id,
          nextAvailableAt: s.availability.nextAvailableAt,
          capacityNotes: s.availability.capacityNotes,
          updatedAt: now,
        })
        .onConflictDoNothing();
    }
  }

  client.close();

  return {
    patients: patientFixtures.length,
    chartEntries: chartFixtures.length,
    specialists: specialistFixtures.length,
  };
}

// Allow running directly: `tsx src/db/seed/run.ts`
const isMain = process.argv[1]?.endsWith("run.ts") || process.argv[1]?.endsWith("run.js");
if (isMain) {
  runSeed({ truncate: true })
    .then((result) => {
      console.log("Seed complete:", result);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
