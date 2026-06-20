import { specialtyGroups } from '../fixtures/specialtyTaxonomy'

const GROUP_LABELS = {
  en: {
    'Specialists / Specialty Clinics': 'Specialists / Specialty Clinics',
    'Allied Care': 'Allied Care',
  },
  fr: {
    'Specialists / Specialty Clinics': 'Spécialistes / Cliniques spécialisées',
    'Allied Care': 'Soins paramédicaux',
  },
}

const SPECIALTY_FR = {
  Abortion: 'Avortement',
  Addictions: 'Addictions',
  'Allergy & Immunology': 'Allergie et immunologie',
  Botox: 'Botox',
  'Breast Care': 'Soins mammaires',
  'Body Maps': 'Cartographie corporelle',
  'Blood Transfusion': 'Transfusion sanguine',
  'Concussion & Acquired Brain Injury': 'Commotion et lésion cérébrale acquise',
  Circumcisions: 'Circoncisions',
  'Cardiology & Cardiac Testing': 'Cardiologie et tests cardiaques',
  Dermatology: 'Dermatologie',
  Dentistry: 'Dentisterie',
  ENT: 'ORL',
  Endocrinology: 'Endocrinologie',
  'Obstetrics & Gynecology': 'Obstétrique et gynécologie',
  Genetics: 'Génétique',
  Geriatrics: 'Gériatrie',
  'General Surgery': 'Chirurgie générale',
  'Gastroenterology & Hepatology': 'Gastroentérologie et hépatologie',
  'Hematology & Thrombosis': 'Hématologie et thrombose',
  'Internal Medicine': 'Médecine interne',
  'Infectious Diseases': 'Maladies infectieuses',
  'Longevity Medicine/Preventative': 'Médecine de longévité / préventive',
  'Medical Imaging/Radiology': 'Imagerie médicale / radiologie',
  Nephrology: 'Néphrologie',
  'Neurology & TIA/Stroke': 'Neurologie et AIT/AVC',
  Neurosurgery: 'Neurochirurgie',
  'Obesity Medicine': 'Médecine de l’obésité',
  "Obstetrics & Women's Health (Family MDs)": 'Obstétrique et santé des femmes (MF)',
  Oncology: 'Oncologie',
  Ophthalmology: 'Ophtalmologie',
  'Orthopaedic Surgery & Specialised Clinics': 'Chirurgie orthopédique et cliniques spécialisées',
  'Pain Clinics': 'Cliniques de la douleur',
  'Palliative Care': 'Soins palliatifs',
  Pediatrics: 'Pédiatrie',
  Physiatry: 'Physiatrie',
  'Plastic Surgery': 'Chirurgie plastique',
  'Psychiatry & Mental Health': 'Psychiatrie et santé mentale',
  Respirology: 'Pneumologie',
  Rheumatology: 'Rhumatologie',
  'Sleep Medicine': 'Médecine du sommeil',
  'Sports Medicine': 'Médecine sportive',
  'Thoracic Surgery': 'Chirurgie thoracique',
  Urology: 'Urologie',
  'Urgent Care Clinics': 'Cliniques de soins urgents',
  'Vasectomy Clinics': 'Cliniques de vasectomie',
  'Vein Clinics': 'Cliniques veineuses',
  'Vascular Surgery': 'Chirurgie vasculaire',
  'Wound Care': 'Soins des plaies',
  Physiotherapy: 'Physiothérapie',
  'Occupational Therapy': 'Ergothérapie',
  Chiropractors: 'Chiropraticiens',
  'Registered Massage Therapy': 'Massothérapie',
  'Ontario Health at Home': 'Santé à domicile Ontario',
  'Mental Health, Substance Use Health and Addictions':
    'Santé mentale, consommation de substances et addictions',
}

export function translateSpecialtyGroup(label, lang) {
  if (lang !== 'fr') return label
  return GROUP_LABELS.fr[label] ?? label
}

export function translateSpecialty(name, lang) {
  if (lang !== 'fr') return name
  return SPECIALTY_FR[name] ?? name
}

export function getLocalizedSpecialtyGroups(lang) {
  return specialtyGroups.map((group) => ({
    label: translateSpecialtyGroup(group.label, lang),
    options: group.options.map((option) => ({
      value: option,
      label: translateSpecialty(option, lang),
    })),
  }))
}
