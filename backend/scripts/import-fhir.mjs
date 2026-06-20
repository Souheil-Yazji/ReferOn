/**
 * FHIR → ReferOn seed data importer
 *
 * Reads Synthea FHIR R4 bundles and generates:
 *   - backend/src/db/seed/patients.json
 *   - backend/src/db/seed/chart_entries.json
 *   - frontend/src/fixtures/patients.js
 *   - frontend/src/fixtures/chartEntries.js
 *
 * Usage:  node backend/scripts/import-fhir.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const FHIR_DIR = join(REPO_ROOT, 'backend', 'output', 'fhir');

// ---------------------------------------------------------------------------
// Patient selection: FHIR file → demo scenario
// ---------------------------------------------------------------------------
const SELECTED = [
  {
    file: 'Andrés117_Olivo261_5c9f20d5-8361-b331-9267-5303ca5b136a.json',
    patientId: 'pat_cardio_001',
    scenario: 'cardiology',
    primaryConditionKeywords: ['ischemic heart', 'coronary', 'cardiac', 'heart disease'],
    lat: 43.6468,
    lng: -79.3876,
    city: 'Toronto, ON',
    ohip: '2847-391-505',
  },
  {
    file: 'Ashely524_Maybelle917_Swaniawski813_d545798e-09a4-ef89-abc5-9f62dc5a5095.json',
    patientId: 'pat_pulmo_002',
    scenario: 'pulmonology',
    primaryConditionKeywords: ['asthma', 'copd', 'emphysema', 'chronic obstructive'],
    lat: 43.6421,
    lng: -79.4320,
    city: 'Toronto, ON',
    ohip: '7193-824-061',
  },
  {
    file: 'Kimi714_Katerine813_Cummings51_eed8a921-eac8-0778-4113-255f4e35506a.json',
    patientId: 'pat_ortho_003',
    scenario: 'orthopedic',
    primaryConditionKeywords: ['osteoarthritis', 'arthritis', 'chronic pain'],
    lat: 43.7731,
    lng: -79.2576,
    city: 'Scarborough, ON',
    ohip: '4536-218-779',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function decodeBase64(data) {
  return Buffer.from(data, 'base64').toString('utf-8');
}

function cleanName(str) {
  // Remove Synthea numeric suffixes (e.g. Ashely524 → Ashley, Kimi714 → Kimi)
  return str.replace(/\d+/g, '').trim();
}

function isoDate(dt) {
  if (!dt) return null;
  return dt.slice(0, 10);
}

function latestDate(...dates) {
  return dates.filter(Boolean).sort().reverse()[0] || null;
}

// Skip social-determinants, administrative, and trivial/dental FHIR conditions
const SKIP_CONDITION_WORDS = [
  'education', 'employment', 'labor force', 'social isolation', 'limited social',
  'refugee', 'military', 'criminal record', 'stress', 'not in labor',
  'abuse', 'review due', 'intimate partner', 'violence in the environment',
  'transport', 'housing', 'economic', 'heterosexual', 'socioeconomic',
  'dental', 'gingivitis', 'gingival', 'dental caries', 'dental filling',
  'tooth', 'teeth', 'oral', 'mandible', 'jaw',
  'viral sinusitis', 'acute sinusitis', 'acute viral pharyngitis', 'acute bronchitis',
  'acute infective cystitis', 'normal pregnancy', 'miscarriage', 'eclampsia',
  'fracture of mandible', 'primary dental',
  'part-time', 'full-time', 'unemployed', 'refugee', 'higher education',
  'history of seizure', // duplicate of epilepsy
];

// Conditions considered high clinical priority for problem list
const HIGH_PRIORITY_KEYWORDS = [
  'ischemic heart', 'heart disease', 'coronary', 'cardiac', 'hypertension',
  'asthma', 'copd', 'emphysema', 'diabetes', 'prediabetes',
  'osteoarthritis', 'arthritis', 'cancer', 'neoplasm', 'tumor',
  'epilepsy', 'seizure disorder', 'chronic pain', 'metabolic syndrome',
  'obesity', 'anemia', 'osteoporosis', 'chronic sinusitis',
  'migraine', 'transformed migraine', 'hyperlipidemia',
  'chronic obstructive', 'chronic low back', 'chronic neck',
];

function isClinical(condText) {
  const lower = condText.toLowerCase();
  return !SKIP_CONDITION_WORDS.some(w => lower.includes(w));
}

function clinicalPriority(condText) {
  const lower = condText.toLowerCase();
  if (HIGH_PRIORITY_KEYWORDS.some(k => lower.includes(k))) return 0; // highest
  if (lower.includes('disorder') || lower.includes('disease')) return 1;
  if (lower.includes('finding') || lower.includes('situation')) return 2;
  return 1;
}

// Category codes that indicate lab/imaging
const LAB_CATS = ['LAB', 'laboratory', 'Laboratory', 'Lab'];
const IMG_CATS = ['RAD', 'radiology', 'Radiology', 'imaging'];

function getDRCategory(dr) {
  const cats = [];
  for (const cat of (dr.category || [])) {
    for (const cod of (cat.coding || [])) {
      cats.push(cod.code || '', cod.display || '');
    }
    if (cat.text) cats.push(cat.text);
  }
  const code = (dr.code?.coding?.[0]?.code || '') + '/' + (dr.code?.text || '');
  const codeText = dr.code?.text || dr.code?.coding?.[0]?.display || '';

  if (cats.some(c => LAB_CATS.some(l => c.toLowerCase().includes(l.toLowerCase())))) return 'lab';
  if (cats.some(c => IMG_CATS.some(l => c.toLowerCase().includes(l.toLowerCase())))) return 'imaging';
  if (codeText.toLowerCase().includes('imaging') || codeText.toLowerCase().includes('x-ray') ||
      codeText.toLowerCase().includes('mri') || codeText.toLowerCase().includes('ct ') ||
      codeText.toLowerCase().includes('ultrasound') || codeText.toLowerCase().includes('radiograph')) {
    return 'imaging';
  }
  if (codeText.toLowerCase().includes('panel') || codeText.toLowerCase().includes('test') ||
      codeText.toLowerCase().includes('screen') || codeText.toLowerCase().includes('questionnaire') ||
      codeText.toLowerCase().includes('score') || codeText.toLowerCase().includes('phq') ||
      codeText.toLowerCase().includes('audit')) {
    return 'lab';
  }
  // History and physical → note, not lab
  if (codeText.toLowerCase().includes('history and physical') ||
      cats.some(c => c.includes('34117-2') || c.includes('51847-2'))) return 'note';
  return 'lab'; // default
}

// ---------------------------------------------------------------------------
// Extract all resources from a bundle
// ---------------------------------------------------------------------------
function extractBundle(bundle) {
  const byType = {};
  for (const entry of (bundle.entry || [])) {
    const rt = entry.resource?.resourceType;
    if (!rt) continue;
    byType[rt] = byType[rt] || [];
    byType[rt].push(entry.resource);
  }
  return byType;
}

// ---------------------------------------------------------------------------
// Scenario-specific referral notes (generated from FHIR conditions/meds data)
// These replace the generic "No complaints" Synthea visit notes.
// ---------------------------------------------------------------------------
function buildScenarioNotes(config, pat, conditions, meds) {
  const fullName = pat._fullName;
  const age = new Date().getFullYear() - parseInt(pat.dob?.slice(0, 4) || '1970');
  const genderLabel = pat.sex === 'female' ? 'female' : 'male';
  const condNames = conditions.map(c => c.code?.text || c.code?.coding?.[0]?.display || '').filter(Boolean);
  const medNames = meds.map(m =>
    m.medicationCodeableConcept?.text || m.medication?.concept?.text || m.medicationReference?.display || ''
  ).filter(Boolean);
  const today = new Date().toISOString().slice(0, 10);
  const threeMonthsAgo = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);

  if (config.scenario === 'cardiology') {
    return [
      {
        date: today,
        title: 'Follow-up: Ischemic Heart Disease — Cardiology Referral',
        content: `${today}\n\n# Chief Complaint\nFollow-up for known ischemic heart disease; requesting cardiology review.\n\n# History of Present Illness\n${fullName} is a ${age}-year-old ${genderLabel} with a history of ischemic heart disease (diagnosed 2012), essential hypertension, metabolic syndrome, and chronic pain. Patient reports occasional exertional chest discomfort and fatigue. Currently managed with metoprolol, clopidogrel, nitroglycerin spray PRN, simvastatin, lisinopril, and amlodipine. Given persistent symptoms and the complexity of cardiovascular risk factors, formal cardiology review is requested for risk stratification and treatment optimisation.\n\n# Medications\n${medNames.slice(0, 7).join('; ')}\n\n# Assessment and Plan\nReferral to Cardiology for comprehensive cardiovascular risk assessment and management review.`,
      },
      {
        date: threeMonthsAgo,
        title: 'Abnormal Cardiac Imaging — Cardiology History',
        content: `${threeMonthsAgo}\n\n# Chief Complaint\nAbnormal findings on cardiac imaging (on file since 2012).\n\n# History of Present Illness\nPatient has documented abnormal findings on cardiac imaging (coronary circulation). Also carries active diagnoses of metabolic syndrome X and chronic low back and neck pain, likely contributing to functional limitation. Blood pressure well-controlled on current antihypertensive regimen. Repeat lipid panel and renal function reviewed.\n\n# Assessment\nContinue current cardiovascular medications. Follow up with cardiology for updated echocardiographic assessment.`,
      },
    ];
  }

  if (config.scenario === 'orthopedic') {
    return [
      {
        date: today,
        title: 'Right Hip Pain — Orthopedic Referral',
        content: `${today}\n\n# Chief Complaint\nWorsening right hip pain; requesting orthopedic consultation.\n\n# History of Present Illness\n${fullName} is a ${age}-year-old ${genderLabel} with longstanding osteoarthritis of the hip (onset 2005) and chronic pain diagnosed 2012. Pain has progressed over the past year, significantly limiting ambulation and activities of daily living. Conservative management with naproxen sodium and physiotherapy has provided only partial relief. BMI in the obese range (active); hypertension and metabolic syndrome are co-morbidities. Patient is requesting assessment for advanced management options including possible surgical intervention.\n\n# Medications\n${medNames.slice(0, 6).join('; ')}\n\n# Assessment and Plan\nReferral to Orthopedic Surgery for hip OA assessment and evaluation of surgical candidacy.`,
      },
      {
        date: threeMonthsAgo,
        title: 'Chronic Pain Management Review — Hip OA',
        content: `${threeMonthsAgo}\n\n# Chief Complaint\nOngoing follow-up for chronic hip pain.\n\n# History of Present Illness\nPatient continues to report moderate-to-severe right hip pain rated 6-7/10 at rest and 8/10 with activity. Naproxen provides temporary relief only. X-ray ordered previously showing joint space narrowing consistent with advanced osteoarthritis. Prediabetes and anemia noted on recent labs.\n\n# Assessment\nEscalation of referral to orthopedics required given progressive functional decline. Pre-operative labs ordered.`,
      },
    ];
  }

  // Pulmonology — use actual FHIR notes (they have real chief complaints)
  return null;
}

// ---------------------------------------------------------------------------
// Transform one FHIR patient into backend + frontend records
// ---------------------------------------------------------------------------
function transformPatient(bundle, config) {
  const res = extractBundle(bundle);

  // ---- Patient demographics ----
  const pat = (res.Patient || [])[0];
  if (!pat) throw new Error('No Patient resource');

  const nameObj = (pat.name || [])[0] || {};
  const givenRaw = (nameObj.given || []).join(' ');
  const familyRaw = nameObj.family || '';
  const given = cleanName(givenRaw);
  const family = cleanName(familyRaw);
  const fullName = `${given} ${family}`.trim();
  const dob = pat.birthDate || '';
  const gender = pat.gender || 'unknown';

  const backendPatient = {
    id: config.patientId,
    name: fullName,
    dob,
    sex: gender === 'female' ? 'female' : gender === 'male' ? 'male' : 'other',
    addressSummary: config.city,
    lat: config.lat,
    lng: config.lng,
    scenario: config.scenario,
    // Store _fullName on the object temporarily for note generation (removed from JSON output)
    _fullName: fullName,
  };

  const frontendPatient = {
    id: config.patientId,
    name: fullName,
    dob,
    ohip: config.ohip,
    location: { lat: config.lat, lng: config.lng, label: config.city },
  };

  // ---- Chart entries ----
  const chartEntries = [];
  let chartSeq = 0;
  const makeId = (type) => `chart_${config.patientId}_${type}_${String(++chartSeq).padStart(2, '0')}`;

  // ---- Collect conditions and meds for note generation ----
  const allConds = (res.Condition || []).filter(c => {
    const text = c.code?.text || c.code?.coding?.[0]?.display || '';
    return isClinical(text);
  });
  const allMeds = (res.MedicationRequest || [])
    .sort((a, b) => (b.authoredOn || '').localeCompare(a.authoredOn || ''));

  // 1. Visit notes
  const scenarioNotes = buildScenarioNotes(config, backendPatient, allConds, allMeds);

  if (scenarioNotes) {
    // Use hand-crafted scenario notes
    for (const note of scenarioNotes) {
      const id = makeId('note');
      chartEntries.push({
        backend: {
          id, patientId: config.patientId, entryType: 'note', entryDate: note.date,
          summary: note.title,
          fullText: note.content,
        },
        frontend: {
          id, patientId: config.patientId, date: note.date,
          type: 'visit_note', title: note.title, content: note.content,
        },
      });
    }
  } else {
    // Use FHIR DocumentReference notes, skip "No complaints" if real complaint exists elsewhere
    const docs = [...(res.DocumentReference || [])]
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    let notesAdded = 0;
    for (const doc of docs) {
      if (notesAdded >= 3) break;
      let fullText = '';
      for (const content of (doc.content || [])) {
        const data = content.attachment?.data;
        if (data) { fullText = decodeBase64(data).trim(); break; }
      }
      if (!fullText) continue;

      const date = isoDate(doc.date) || '';
      const ccMatch = fullText.match(/# Chief Complaint\s*([\s\S]*?)(?=\n#)/);
      const ccText = ccMatch ? ccMatch[1].replace(/\n/g, ' ').trim() : '';
      // Skip purely administrative "No complaints" notes only if we already have good notes
      if (notesAdded > 0 && ccText.toLowerCase().startsWith('no complaints')) continue;

      const title = ccText && !ccText.toLowerCase().startsWith('no complaints')
        ? `Visit Note — ${ccText.slice(0, 60)}`
        : `Clinical Visit Note — ${date}`;
      const id = makeId('note');
      chartEntries.push({
        backend: { id, patientId: config.patientId, entryType: 'note', entryDate: date, summary: title, fullText },
        frontend: { id, patientId: config.patientId, date, type: 'visit_note', title, content: fullText.slice(0, 1200) },
      });
      notesAdded++;
    }
  }

  // 2. Lab DiagnosticReports (exclude notes, score questionnaires)
  const labSkipWords = ['history and physical', 'phq', 'audit', 'hark', 'prapare', 'gad-7', 'morse', 'dast', 'death'];
  const labDRs = [...(res.DiagnosticReport || [])]
    .filter(dr => {
      const cat = getDRCategory(dr);
      const code = (dr.code?.text || dr.code?.coding?.[0]?.display || '').toLowerCase();
      return cat === 'lab' && !labSkipWords.some(w => code.includes(w));
    })
    .sort((a, b) => {
      const da = a.effectiveDateTime || a.effectivePeriod?.start || '';
      const db = b.effectiveDateTime || b.effectivePeriod?.start || '';
      return db.localeCompare(da);
    })
    .slice(0, 4);

  for (const dr of labDRs) {
    const code = dr.code?.text || dr.code?.coding?.[0]?.display || 'Lab Result';
    const date = isoDate(dr.effectiveDateTime || dr.effectivePeriod?.start || '');
    if (!date) continue;

    // Try to get presented form content
    let content = `Laboratory report: ${code}.`;
    for (const form of (dr.presentedForm || [])) {
      const data = form.data;
      if (data) {
        content = decodeBase64(data).trim().slice(0, 600);
        break;
      }
    }

    const id = makeId('lab');
    chartEntries.push({
      backend: { id, patientId: config.patientId, entryType: 'lab', entryDate: date, summary: code, fullText: content },
      frontend: { id, patientId: config.patientId, date, type: 'lab', title: code, content },
    });
  }

  // 3. Imaging DiagnosticReports + ImagingStudies
  const imgDRs = [...(res.DiagnosticReport || [])]
    .filter(dr => getDRCategory(dr) === 'imaging')
    .sort((a, b) => {
      const da = a.effectiveDateTime || a.effectivePeriod?.start || '';
      const db = b.effectiveDateTime || b.effectivePeriod?.start || '';
      return db.localeCompare(da);
    })
    .slice(0, 3);

  for (const dr of imgDRs) {
    const code = dr.code?.text || dr.code?.coding?.[0]?.display || 'Imaging Report';
    const date = isoDate(dr.effectiveDateTime || dr.effectivePeriod?.start || '');
    if (!date) continue;

    let content = `Imaging study: ${code}.`;
    for (const form of (dr.presentedForm || [])) {
      if (form.data) { content = decodeBase64(form.data).trim().slice(0, 600); break; }
    }

    const id = makeId('imaging');
    chartEntries.push({
      backend: { id, patientId: config.patientId, entryType: 'imaging', entryDate: date, summary: code, fullText: content },
      frontend: { id, patientId: config.patientId, date, type: 'imaging', title: code, content },
    });
  }

  // 4. Medications — aggregate active MedicationRequests into one entry
  const medRequests = [...(res.MedicationRequest || [])]
    .filter(m => m.status === 'active' || m.status === 'completed')
    .sort((a, b) => (b.authoredOn || '').localeCompare(a.authoredOn || ''));

  // Deduplicate by drug name and take the most recent per drug
  const seenDrugs = new Set();
  const activeMeds = [];
  for (const m of medRequests) {
    const drug =
      m.medicationCodeableConcept?.text ||
      m.medication?.concept?.text ||
      m.medicationReference?.display ||
      m.medication?.coding?.[0]?.display ||
      '';
    if (!drug || seenDrugs.has(drug)) continue;
    seenDrugs.add(drug);
    activeMeds.push({ drug, date: m.authoredOn?.slice(0, 10) || '' });
    if (activeMeds.length >= 8) break;
  }

  if (activeMeds.length > 0) {
    const mostRecentDate = activeMeds[0].date || dob;
    const medList = activeMeds.map(m => m.drug).join('; ');
    const id = makeId('medication');
    chartEntries.push({
      backend: {
        id, patientId: config.patientId, entryType: 'medication', entryDate: mostRecentDate,
        summary: `Current medications (${activeMeds.length})`,
        fullText: `Current medications as of ${mostRecentDate}:\n${activeMeds.map(m => `- ${m.drug}`).join('\n')}`,
      },
      frontend: {
        id, patientId: config.patientId, date: mostRecentDate,
        type: 'medication', title: 'Current Medications',
        content: `Current medications as of ${mostRecentDate}: ${medList}.`,
      },
    });
  }

  // 5. Allergies
  const allergies = res.AllergyIntolerance || [];
  if (allergies.length > 0) {
    const allergyList = allergies.map(a => {
      const substance = a.code?.text || a.code?.coding?.[0]?.display || 'Unknown substance';
      const reaction = (a.reaction || []).flatMap(r => r.manifestation || [])
        .map(m => m.coding?.[0]?.display || m.text || '').filter(Boolean).join(', ');
      return reaction ? `${substance} (${reaction})` : substance;
    });
    const date = isoDate(allergies[0].recordedDate) || dob;
    const id = makeId('allergy');
    chartEntries.push({
      backend: {
        id, patientId: config.patientId, entryType: 'allergy', entryDate: date,
        summary: allergyList.join('; '),
        fullText: `Allergy list:\n${allergyList.map(a => `- ${a}`).join('\n')}`,
      },
      frontend: {
        id, patientId: config.patientId, date,
        type: 'allergy', title: 'Allergy List',
        content: allergyList.join('; ') || 'No known allergies.',
      },
    });
  } else {
    // Explicit no-known-allergies entry
    const id = makeId('allergy');
    chartEntries.push({
      backend: {
        id, patientId: config.patientId, entryType: 'allergy', entryDate: dob,
        summary: 'No known drug allergies.',
        fullText: 'No known drug allergies.',
      },
      frontend: {
        id, patientId: config.patientId, date: dob,
        type: 'allergy', title: 'Allergy List',
        content: 'No known drug allergies.',
      },
    });
  }

  // 6. Active clinical conditions as a single "Diagnosis / Problem List" entry
  const primaryKeys = config.primaryConditionKeywords || [];
  const isPrimary = (text) => primaryKeys.some(k => text.toLowerCase().includes(k));

  const conds = [...(res.Condition || [])]
    .filter(c => {
      const text = c.code?.text || c.code?.coding?.[0]?.display || '';
      const status = c.clinicalStatus?.coding?.[0]?.code || '';
      const abated = c.abatementDateTime || c.abatementPeriod?.end;
      return isClinical(text) && (status === 'active' || (!abated && status !== 'resolved'));
    })
    .sort((a, b) => {
      const ta = a.code?.text || a.code?.coding?.[0]?.display || '';
      const tb = b.code?.text || b.code?.coding?.[0]?.display || '';
      // Primary scenario conditions always first
      const pa_primary = isPrimary(ta) ? -1 : 0;
      const pb_primary = isPrimary(tb) ? -1 : 0;
      if (pa_primary !== pb_primary) return pa_primary - pb_primary;
      // Then by general clinical priority
      const pa = clinicalPriority(ta);
      const pb = clinicalPriority(tb);
      if (pa !== pb) return pa - pb;
      // Then by onset date descending
      const da = a.onsetDateTime || a.onsetPeriod?.start || a.recordedDate || '';
      const db = b.onsetDateTime || b.onsetPeriod?.start || b.recordedDate || '';
      return db.localeCompare(da);
    });

  if (conds.length > 0) {
    const condList = conds.slice(0, 10).map(c => {
      const text = c.code?.text || c.code?.coding?.[0]?.display || 'Unknown condition';
      const onset = isoDate(c.onsetDateTime || c.onsetPeriod?.start) || '';
      return onset ? `${text} (onset ${onset})` : text;
    });
    const mostRecent = isoDate(conds[0].onsetDateTime || conds[0].onsetPeriod?.start || conds[0].recordedDate) || dob;
    const id = makeId('diagnosis');
    chartEntries.push({
      backend: {
        id, patientId: config.patientId, entryType: 'diagnosis', entryDate: mostRecent,
        summary: `Problem list: ${conds.slice(0, 3).map(c => c.code?.text || '').join(', ')}`,
        fullText: `Active problem list:\n${condList.map(c => `- ${c}`).join('\n')}`,
      },
      frontend: {
        id, patientId: config.patientId, date: mostRecent,
        type: 'visit_note', title: 'Problem List / Active Diagnoses',
        content: `Active diagnoses:\n${condList.map(c => `- ${c}`).join('\n')}`,
      },
    });
  }

  return { backendPatient, frontendPatient, chartEntries };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const allBackendPatients = [];
const allBackendChartEntries = [];
const allFrontendPatients = [];
const allFrontendChartEntries = [];

for (const config of SELECTED) {
  const filePath = join(FHIR_DIR, config.file);
  console.log(`Processing ${config.file} → ${config.patientId} (${config.scenario})`);

  let bundle;
  try {
    bundle = JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch (e) {
    console.error(`  ERROR reading file: ${e.message}`);
    continue;
  }

  let result;
  try {
    result = transformPatient(bundle, config);
  } catch (e) {
    console.error(`  ERROR transforming: ${e.message}`);
    continue;
  }

  const { backendPatient, frontendPatient, chartEntries } = result;

  const { _fullName: _removed, ...cleanPatient } = backendPatient;
  allBackendPatients.push(cleanPatient);
  allFrontendPatients.push(frontendPatient);

  for (const entry of chartEntries) {
    allBackendChartEntries.push(entry.backend);
    allFrontendChartEntries.push(entry.frontend);
  }

  console.log(`  → ${chartEntries.length} chart entries`);
}

// ---------------------------------------------------------------------------
// Write backend seed files
// ---------------------------------------------------------------------------
const backendSeedDir = join(REPO_ROOT, 'backend', 'src', 'db', 'seed');

writeFileSync(
  join(backendSeedDir, 'patients.json'),
  JSON.stringify(allBackendPatients, null, 2) + '\n'
);
console.log(`\nWrote backend/src/db/seed/patients.json (${allBackendPatients.length} patients)`);

writeFileSync(
  join(backendSeedDir, 'chart_entries.json'),
  JSON.stringify(allBackendChartEntries, null, 2) + '\n'
);
console.log(`Wrote backend/src/db/seed/chart_entries.json (${allBackendChartEntries.length} entries)`);

// ---------------------------------------------------------------------------
// Write frontend fixture files
// ---------------------------------------------------------------------------
const frontendFixtureDir = join(REPO_ROOT, 'frontend', 'src', 'fixtures');

const patientsJs = `export const patients = ${JSON.stringify(allFrontendPatients, null, 2)}\n`;
writeFileSync(join(frontendFixtureDir, 'patients.js'), patientsJs);
console.log(`Wrote frontend/src/fixtures/patients.js (${allFrontendPatients.length} patients)`);

// Build a seeded predictions map for the frontend mock mode
const predictionsMap = {};
for (const config of SELECTED) {
  const entries = allFrontendChartEntries.filter(e => e.patientId === config.patientId);
  const noteIds = entries.filter(e => e.type === 'visit_note').map(e => e.id);

  let specialty = 'Internal Medicine';
  let confidence = 0.65;
  let rationale = 'General assessment required.';

  if (config.scenario === 'cardiology') {
    specialty = 'Cardiology';
    confidence = 0.81;
    rationale = 'Patient has documented ischemic heart disease and essential hypertension. Recent clinical notes indicate cardiovascular risk factors requiring specialist assessment.';
  } else if (config.scenario === 'pulmonology') {
    specialty = 'Pulmonology';
    confidence = 0.87;
    rationale = 'Active asthma with current symptoms of wheezing, mucus secretion, and cough documented in recent clinical notes. Pulmonology evaluation indicated for optimisation of management.';
  } else if (config.scenario === 'orthopedic') {
    specialty = 'Orthopedic Surgery';
    confidence = 0.79;
    rationale = 'Osteoarthritis of hip with chronic pain documented. Orthopedic consultation indicated to assess surgical and non-surgical management options.';
  }

  predictionsMap[config.patientId] = {
    specialty,
    confidence,
    rationale,
    sourceRefIds: noteIds.slice(0, 2),
  };
}

const chartEntriesJs = `export const chartEntries = ${JSON.stringify(allFrontendChartEntries, null, 2)}\n`;
writeFileSync(join(frontendFixtureDir, 'chartEntries.js'), chartEntriesJs);
console.log(`Wrote frontend/src/fixtures/chartEntries.js (${allFrontendChartEntries.length} entries)`);

// Write seeded predictions as a separate export for referrals.js
const predictionsJs = `// Auto-generated by import-fhir.mjs — do not edit manually
export const SEEDED_PREDICTIONS = ${JSON.stringify(predictionsMap, null, 2)}\n`;
writeFileSync(join(frontendFixtureDir, 'seededPredictions.js'), predictionsJs);
console.log(`Wrote frontend/src/fixtures/seededPredictions.js`);

console.log('\nDone. Run `cd backend && npm run db:seed` to load into the database.');
