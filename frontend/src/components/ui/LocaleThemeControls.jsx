import { Moon, Sun } from 'lucide-react'
import { useAppSettings } from '../../context/useAppSettings'
import { useTranslation } from '../../i18n/useTranslation'

function SegmentedControl({ value, options, onChange, ariaLabel }) {
  return (
    <div
      className="flex items-center gap-0.5 rounded-md border border-slate-200 bg-white p-0.5 dark:border-slate-600 dark:bg-slate-800"
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
            value === option.value
              ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-200'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default function LocaleThemeControls() {
  const { lang, setLang, theme, toggleTheme } = useAppSettings()
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-2">
      <SegmentedControl
        ariaLabel={t('lang')}
        value={lang}
        onChange={setLang}
        options={[
          { value: 'en', label: 'EN' },
          { value: 'fr', label: 'FR' },
        ]}
      />
      <button
        type="button"
        onClick={toggleTheme}
        title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        aria-label={theme === 'dark' ? t('theme.light') : t('theme.dark')}
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    </div>
  )
}
