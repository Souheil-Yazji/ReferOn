// Demo fallback predictions for mock mode — matches curated demo patients
export const SEEDED_PREDICTIONS = {
  pat_001: {
    specialty: 'Orthopedic Surgery',
    confidence: 0.82,
    rationale:
      'Recent chart entries show persistent right knee pain, failed conservative management over 6 months, and abnormal MRI findings. These findings align with orthopedic surgical evaluation criteria.',
    sourceRefIds: ['chart_001', 'chart_002'],
    draft: {
      reason:
        'Referral for assessment and management of progressive right knee osteoarthritis with failed conservative treatment.',
      relevantHistory:
        'Patient reports persistent right knee pain for 6 months, worsened by stairs and prolonged standing. Conservative management with NSAIDs and physiotherapy has failed to provide adequate relief. MRI demonstrates moderate-to-severe medial compartment osteoarthritis with cartilage thinning.',
      medications: 'Naproxen 500mg BID PRN, Acetaminophen 650mg QID PRN, Atorvastatin 20mg daily, Levothyroxine 75mcg daily',
      allergies: 'Penicillin (rash). No known food allergies.',
      investigations:
        'MRI Right Knee (2026-02-14): Moderate-to-severe medial compartment osteoarthritis with cartilage thinning and small joint effusion. CBC + ESR/CRP (2026-01-20): Mildly elevated inflammatory markers consistent with localized joint inflammation.',
      additionalNotes: 'Patient prefers surgical consultation if indicated. No prior knee surgeries.',
    },
  },
  pat_002: {
    specialty: 'Cardiology',
    confidence: 0.74,
    rationale:
      'Exertional chest discomfort, dyslipidemia on recent labs, and nonspecific ECG ST changes warrant cardiology risk assessment.',
    sourceRefIds: ['chart_010', 'chart_011', 'chart_012'],
    draft: {
      reason:
        'Referral for cardiology evaluation of exertional chest pain and ECG changes concerning for ischemic heart disease.',
      relevantHistory:
        'Patient reports intermittent chest tightness with exertion over the past 3 weeks, resolves with rest. Family history of CAD. Dyslipidemia confirmed on recent lipid panel.',
      medications: 'Metformin 1000mg BID, Ramipril 5mg daily',
      allergies: 'None known',
      investigations:
        'Lipid Panel (2026-02-28): Total cholesterol 6.4 mmol/L, LDL 4.1 mmol/L. ECG (2026-02-28): Sinus rhythm with nonspecific ST changes in leads V4-V6.',
      additionalNotes: 'Urgent priority given ECG findings and family history.',
    },
  },
  pat_003: {
    specialty: 'Dermatology',
    confidence: 0.88,
    rationale:
      'Documented irregular borders and color change in a shoulder mole meeting partial ABCDE criteria indicate need for dermatologic evaluation to rule out malignancy.',
    sourceRefIds: ['chart_020', 'chart_021'],
    draft: {
      reason:
        'Referral for dermatologic evaluation of suspicious pigmented lesion on left shoulder.',
      relevantHistory:
        'Patient noticed irregular borders and color change in a mole on the left shoulder over the past 2 months. ABCDE criteria partially met.',
      medications: 'Oral contraceptive (combined), Cetirizine 10mg PRN',
      allergies: 'Sulfa drugs (hives)',
      investigations:
        'Dermoscopy photo: asymmetric pigmentation, irregular border, approx 7mm diameter.',
      additionalNotes: '',
    },
  },
  pat_004: {
    specialty: 'Gastroenterology',
    confidence: 0.61,
    rationale:
      'Chronic epigastric pain with only partial response to PPI therapy and negative H. pylori testing suggests need for endoscopic evaluation.',
    sourceRefIds: ['chart_030', 'chart_031'],
    draft: {
      reason:
        'Referral for gastroenterology evaluation of chronic epigastric pain with incomplete PPI response.',
      relevantHistory:
        'Patient reports recurring epigastric pain and bloating for 4 months, worse after meals. Trial of PPI provided partial relief only.',
      medications: 'Omeprazole 40mg daily, Amlodipine 5mg daily',
      allergies: 'Latex (contact dermatitis)',
      investigations: 'H. pylori stool antigen: negative.',
      additionalNotes: '',
    },
  },
}
