import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../db/client.js";
import {
  referralPatientPreferences,
  referrals,
  specialistAvailability,
  specialistLocations,
  specialists,
  patients,
} from "../db/schema.js";
import { haversineKm } from "../lib/distance.js";

export interface SpecialistMatchResult {
  specialist: {
    id: string;
    name: string;
    clinic: string;
    specialty: string;
    subspecialty: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    acceptingReferrals: boolean;
    caseTypes: string[] | null;
    referralTypes: string[] | null;
    procedures: string[] | null;
  };
  location: {
    lat: number;
    lng: number;
    label: string | null;
    address: string | null;
  } | null;
  distanceKm: number | null;
  nextAvailableAt: string | null;
  capacityNotes: string | null;
  preferenceAlignment: "preferred" | "excluded" | "neutral";
  score: number;
  scoreBreakdown: {
    distanceScore: number;
    availabilityScore: number;
    specialtyFitScore: number;
    preferenceBonus: number;
  };
}

const WEIGHTS = {
  distance: 0.35,
  availability: 0.3,
  specialtyFit: 0.25,
  preference: 0.1,
};

export async function getSpecialistMatches(
  referralId: string
): Promise<SpecialistMatchResult[]> {
  const db = getDb();

  // Load referral + patient location
  const [referral] = await db
    .select()
    .from(referrals)
    .where(eq(referrals.id, referralId))
    .limit(1);

  if (!referral) return [];

  const [patient] = await db
    .select()
    .from(patients)
    .where(eq(patients.id, referral.patientId))
    .limit(1);

  const [prefs] = await db
    .select()
    .from(referralPatientPreferences)
    .where(eq(referralPatientPreferences.referralId, referralId))
    .limit(1);

  const preferredIds = (prefs?.preferredSpecialistIds as string[] | null) ?? [];
  const excludedIds = (prefs?.excludedSpecialistIds as string[] | null) ?? [];
  const maxDistanceKm = prefs?.maxDistanceKm ?? null;
  const referralSpecialty = referral.specialty;

  // Load all accepting specialists
  const allSpecialists = await db
    .select()
    .from(specialists)
    .where(eq(specialists.acceptingReferrals, true));

  if (allSpecialists.length === 0) return [];

  const specIds = allSpecialists.map((s) => s.id);

  // Load locations (use first location per specialist)
  const allLocations = await db
    .select()
    .from(specialistLocations)
    .where(inArray(specialistLocations.specialistId, specIds));

  const locationMap = new Map<
    string,
    (typeof allLocations)[0]
  >();
  for (const loc of allLocations) {
    if (!locationMap.has(loc.specialistId)) {
      locationMap.set(loc.specialistId, loc);
    }
  }

  // Load availability
  const allAvailability = await db
    .select()
    .from(specialistAvailability)
    .where(inArray(specialistAvailability.specialistId, specIds));

  const availabilityMap = new Map<string, (typeof allAvailability)[0]>();
  for (const avail of allAvailability) {
    availabilityMap.set(avail.specialistId, avail);
  }

  const results: SpecialistMatchResult[] = [];

  for (const spec of allSpecialists) {
    // Filter: excluded by patient preference
    if (excludedIds.includes(spec.id)) continue;

    const loc = locationMap.get(spec.id) ?? null;
    const avail = availabilityMap.get(spec.id) ?? null;

    // Filter: specialty match
    if (
      referralSpecialty &&
      spec.specialty.toLowerCase() !== referralSpecialty.toLowerCase() &&
      (spec.subspecialty?.toLowerCase() ?? "") !==
        referralSpecialty.toLowerCase()
    ) {
      continue;
    }

    // Filter: distance constraint
    let distanceKm: number | null = null;
    if (patient?.lat && patient?.lng && loc) {
      distanceKm = haversineKm(patient.lat, patient.lng, loc.lat, loc.lng);
      if (maxDistanceKm !== null && distanceKm > maxDistanceKm) continue;
    }

    // Scoring
    const distanceScore = computeDistanceScore(distanceKm);
    const availabilityScore = computeAvailabilityScore(avail?.nextAvailableAt);
    const specialtyFitScore = computeSpecialtyFitScore(
      spec,
      referralSpecialty
    );
    const isPreferred = preferredIds.includes(spec.id);
    const preferenceBonus = isPreferred ? 1 : 0;

    const score =
      WEIGHTS.distance * distanceScore +
      WEIGHTS.availability * availabilityScore +
      WEIGHTS.specialtyFit * specialtyFitScore +
      WEIGHTS.preference * preferenceBonus;

    results.push({
      specialist: {
        id: spec.id,
        name: spec.name,
        clinic: spec.clinic,
        specialty: spec.specialty,
        subspecialty: spec.subspecialty,
        contactEmail: spec.contactEmail,
        contactPhone: spec.contactPhone,
        acceptingReferrals: spec.acceptingReferrals,
        caseTypes: spec.caseTypes as string[] | null,
        referralTypes: spec.referralTypes as string[] | null,
        procedures: spec.procedures as string[] | null,
      },
      location: loc
        ? { lat: loc.lat, lng: loc.lng, label: loc.label, address: loc.address }
        : null,
      distanceKm: distanceKm !== null ? Math.round(distanceKm * 10) / 10 : null,
      nextAvailableAt: avail?.nextAvailableAt ?? null,
      capacityNotes: avail?.capacityNotes ?? null,
      preferenceAlignment: isPreferred
        ? "preferred"
        : excludedIds.includes(spec.id)
          ? "excluded"
          : "neutral",
      score: Math.round(score * 100) / 100,
      scoreBreakdown: {
        distanceScore: Math.round(distanceScore * 100) / 100,
        availabilityScore: Math.round(availabilityScore * 100) / 100,
        specialtyFitScore: Math.round(specialtyFitScore * 100) / 100,
        preferenceBonus,
      },
    });
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  return results;
}

function computeDistanceScore(distanceKm: number | null): number {
  if (distanceKm === null) return 0.5; // no location data — neutral
  if (distanceKm <= 5) return 1;
  if (distanceKm <= 20) return 0.8;
  if (distanceKm <= 50) return 0.6;
  if (distanceKm <= 100) return 0.4;
  return 0.1;
}

function computeAvailabilityScore(nextAvailableAt: string | null | undefined): number {
  if (!nextAvailableAt) return 0.3; // unknown — below neutral
  const daysUntil =
    (new Date(nextAvailableAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysUntil <= 7) return 1;
  if (daysUntil <= 14) return 0.85;
  if (daysUntil <= 30) return 0.65;
  if (daysUntil <= 60) return 0.4;
  return 0.2;
}

function computeSpecialtyFitScore(
  spec: { specialty: string; subspecialty: string | null },
  referralSpecialty: string | null
): number {
  if (!referralSpecialty) return 0.5;
  if (
    spec.subspecialty?.toLowerCase() === referralSpecialty.toLowerCase()
  ) {
    return 1; // exact subspecialty match
  }
  if (spec.specialty.toLowerCase() === referralSpecialty.toLowerCase()) {
    return 0.8; // general specialty match
  }
  return 0;
}
