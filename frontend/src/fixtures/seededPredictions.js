// Demo fallback predictions for mock mode — matches curated demo patients
export const SEEDED_PREDICTIONS = {
  pat_001: {
    specialty: 'Orthopedic Surgery',
    confidence: 0.82,
    rationale:
      'Recent chart entries show persistent right knee pain, failed conservative management over 6 months, and abnormal MRI findings. These findings align with orthopedic surgical evaluation criteria.',
    sourceRefIds: ['chart_001', 'chart_002'],
  },
  pat_002: {
    specialty: 'Cardiology',
    confidence: 0.74,
    rationale:
      'Exertional chest discomfort, dyslipidemia on recent labs, and nonspecific ECG ST changes warrant cardiology risk assessment.',
    sourceRefIds: ['chart_010', 'chart_011', 'chart_012'],
  },
  pat_003: {
    specialty: 'Dermatology',
    confidence: 0.88,
    rationale:
      'Documented irregular borders and color change in a shoulder mole meeting partial ABCDE criteria indicate need for dermatologic evaluation to rule out malignancy.',
    sourceRefIds: ['chart_020', 'chart_021'],
  },
  pat_004: {
    specialty: 'Gastroenterology',
    confidence: 0.61,
    rationale:
      'Chronic epigastric pain with only partial response to PPI therapy and negative H. pylori testing suggests need for endoscopic evaluation.',
    sourceRefIds: ['chart_030', 'chart_031'],
  },
}
