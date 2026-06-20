import { specialtyTaxonomy } from '../fixtures/specialtyTaxonomy'

const TAXONOMY_SET = new Set(specialtyTaxonomy)

/**
 * Short clinical / AI specialty names → Ontario referral directory labels.
 * AI and seeded specialists use the left-hand keys; UI dropdowns use the right.
 */
export const CLINICAL_TO_TAXONOMY = {
  'Orthopedic Surgery': 'Orthopaedic Surgery & Specialised Clinics',
  'Orthopaedic Surgery': 'Orthopaedic Surgery & Specialised Clinics',
  Cardiology: 'Cardiology & Cardiac Testing',
  Pulmonology: 'Respirology',
  Gastroenterology: 'Gastroenterology & Hepatology',
  'General Internal Medicine': 'Internal Medicine',
  Neurology: 'Neurology & TIA/Stroke',
  Psychiatry: 'Psychiatry & Mental Health',
  'Sports Medicine': 'Sports Medicine',
}

const TAXONOMY_TO_CLINICAL = Object.fromEntries(
  Object.entries(CLINICAL_TO_TAXONOMY).map(([clinical, taxonomy]) => [taxonomy, clinical])
)

/** Map AI/clinical name to a value that exists in the specialty dropdown. */
export function toTaxonomySpecialty(name) {
  if (!name) return 'Internal Medicine'
  if (TAXONOMY_SET.has(name)) return name
  if (CLINICAL_TO_TAXONOMY[name]) return CLINICAL_TO_TAXONOMY[name]

  const lower = name.toLowerCase()
  const byPrefix = specialtyTaxonomy.find(
    (entry) =>
      entry.toLowerCase().startsWith(lower) ||
      lower.startsWith(entry.toLowerCase().split(' ')[0])
  )
  return byPrefix ?? name
}

/** Map taxonomy dropdown value back to clinical name for API matching & storage. */
export function toClinicalSpecialty(name) {
  if (!name) return name
  if (TAXONOMY_TO_CLINICAL[name]) return TAXONOMY_TO_CLINICAL[name]
  if (CLINICAL_TO_TAXONOMY[name] !== undefined) return name
  return name
}

export const DEFAULT_TAXONOMY_SPECIALTY = 'Internal Medicine'
