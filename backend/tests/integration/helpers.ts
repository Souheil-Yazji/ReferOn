import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "../../src/db/schema.js";
import {
  patients,
  chartEntries,
  specialists,
  specialistLocations,
  specialistAvailability,
} from "../../src/db/schema.js";
import { buildApp } from "../../src/index.js";
import { resetDbSingleton } from "../../src/db/client.js";
import { genericId } from "../../src/lib/ids.js";
import { registerPatientScenario } from "../../src/adapters/ai/fallback.js";

export async function createTestApp() {
  // DATABASE_URL is set to a temp file path by tests/setup.ts.
  // Reset the singleton so the app picks up the current env value.
  resetDbSingleton();

  const dbUrl = process.env.DATABASE_URL!;
  const client = createClient({ url: dbUrl });
  const db = drizzle(client, { schema });

  await migrate(db, { migrationsFolder: "./drizzle" });

  // Seed minimal test data
  const now = new Date().toISOString();

  await db.delete(schema.referralRejectionReasons);
  await db.delete(schema.aiPredictions);
  await db.delete(schema.referralPatientPreferences);
  await db.delete(schema.referralDraftContent);
  await db.delete(schema.referrals);
  await db.delete(schema.specialistAvailability);
  await db.delete(schema.specialistLocations);
  await db.delete(schema.specialists);
  await db.delete(schema.chartEntries);
  await db.delete(schema.patients);

  await db.insert(patients).values({
    id: "pat_test_001",
    name: "Test Patient",
    dob: "1970-01-01",
    sex: "male",
    addressSummary: "100 Test St, Toronto, ON",
    lat: 43.65,
    lng: -79.38,
    createdAt: now,
  });

  await db.insert(chartEntries).values([
    {
      id: "chart_test_001",
      patientId: "pat_test_001",
      entryType: "note",
      entryDate: "2026-06-01",
      summary: "Persistent knee pain",
      fullText: "Patient presents with 6-month knee pain history.",
      createdAt: now,
    },
    {
      id: "chart_test_002",
      patientId: "pat_test_001",
      entryType: "imaging",
      entryDate: "2026-05-15",
      summary: "MRI: medial compartment osteoarthritis",
      fullText: "MRI findings: moderate medial OA.",
      createdAt: now,
    },
  ]);

  await db.insert(specialists).values({
    id: "spec_test_001",
    name: "Dr. Test Orthopedic",
    clinic: "Test Clinic",
    specialty: "Orthopedic Surgery",
    subspecialty: null,
    gender: "male",
    acceptingReferrals: true,
    caseTypes: ["adult"],
    referralTypes: ["routine"],
    procedures: ["knee replacement"],
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(specialistLocations).values({
    id: genericId(),
    specialistId: "spec_test_001",
    lat: 43.66,
    lng: -79.39,
    label: "Main Office",
    address: "200 Test Ave, Toronto, ON",
  });

  await db.insert(specialists).values({
    id: "spec_test_002",
    name: "Dr. Test Female Orthopedic",
    clinic: "Test Clinic East",
    specialty: "Orthopedic Surgery",
    subspecialty: null,
    gender: "female",
    acceptingReferrals: true,
    caseTypes: ["adult"],
    referralTypes: ["routine"],
    procedures: ["knee replacement"],
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(specialistLocations).values({
    id: genericId(),
    specialistId: "spec_test_002",
    lat: 43.67,
    lng: -79.37,
    label: "East Office",
    address: "300 Test Ave, Toronto, ON",
  });

  await db.insert(specialistAvailability).values({
    id: genericId(),
    specialistId: "spec_test_002",
    nextAvailableAt: "2026-07-02T09:00:00Z",
    capacityNotes: "Test availability",
    updatedAt: now,
  });

  await db.insert(specialistAvailability).values({
    id: genericId(),
    specialistId: "spec_test_001",
    nextAvailableAt: "2026-07-01T09:00:00Z",
    capacityNotes: "Test availability",
    updatedAt: now,
  });

  registerPatientScenario("pat_test_001", "orthopedic");

  client.close();

  const app = await buildApp();
  return app;
}
