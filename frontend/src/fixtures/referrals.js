function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('.')
    .toUpperCase()
}

export const seedReferrals = [
  {
    id: 'ref_seed_001',
    patientId: 'pat_002',
    patientInitials: initials('David Okafor'),
    specialty: 'Cardiology',
    urgency: 'Urgent',
    status: 'pending',
    dateSent: '2026-06-15',
    specialistId: 'spec_003',
    draft: {
      reason: 'Evaluation of exertional chest discomfort with dyslipidemia.',
      relevantHistory: 'Intermittent chest tightness with exertion over 3 weeks, resolves with rest. Family history of CAD.',
      medications: 'Metformin 1000mg BID, Ramipril 5mg daily.',
      allergies: 'No known drug allergies.',
      investigations: 'Lipid panel: LDL 4.1 mmol/L. ECG: nonspecific ST changes V4-V6.',
      additionalNotes: '',
    },
    rejectionReason: null,
  },
  {
    id: 'ref_seed_002',
    patientId: 'pat_003',
    patientInitials: initials('Sofia Martinez'),
    specialty: 'Dermatology',
    urgency: 'Routine',
    status: 'sent',
    dateSent: '2026-06-10',
    specialistId: 'spec_005',
    draft: {
      reason: 'Suspicious mole on left shoulder, ABCDE criteria partially met.',
      relevantHistory: 'Irregular borders and color change noted over 2 months.',
      medications: 'Oral contraceptive (combined), Cetirizine 10mg PRN.',
      allergies: 'Sulfa drugs (hives).',
      investigations: 'Dermoscopy: asymmetric pigmentation, irregular border, ~7mm diameter.',
      additionalNotes: '',
    },
    rejectionReason: null,
  },
]
