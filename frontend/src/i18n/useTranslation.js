import { useMemo } from 'react'
import { useAppSettings } from '../context/useAppSettings'
import { messages } from './messages'
import { translateSpecialty, translateSpecialtyGroup } from './specialtyLabels'

const URGENCY_KEYS = {
  Routine: 'referral.urgencyRoutine',
  Urgent: 'referral.urgencyUrgent',
  Emergent: 'referral.urgencyEmergent',
  routine: 'referral.urgencyRoutine',
  urgent: 'referral.urgencyUrgent',
  emergent: 'referral.urgencyEmergent',
}

function get(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj)
}

function interpolate(str, vars = {}) {
  if (typeof str !== 'string') return str
  return str.replace(/\{(\w+)\}/g, (_, key) => (vars[key] != null ? String(vars[key]) : `{${key}}`))
}

export function useTranslation() {
  const { lang } = useAppSettings()

  return useMemo(() => {
    const dict = messages[lang] ?? messages.en

    function t(key, vars) {
      const value = get(dict, key) ?? get(messages.en, key) ?? key
      return interpolate(value, vars)
    }

    return {
      t,
      lang,
      locale: lang === 'fr' ? 'fr-CA' : 'en-CA',
      translateSpecialty: (name) => translateSpecialty(name, lang),
      translateSpecialtyGroup: (label) => translateSpecialtyGroup(label, lang),
      translateUrgency: (urgency) => {
        const key = URGENCY_KEYS[urgency]
        return key ? t(key) : urgency
      },
    }
  }, [lang])
}
