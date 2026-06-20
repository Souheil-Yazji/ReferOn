import { useState } from 'react'
import Button from '../ui/Button'
import { useTranslation } from '../../i18n/useTranslation'

export default function RequestInfoModal({ onSubmit, onClose }) {
  const { t } = useTranslation()
  const [message, setMessage] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold tracking-tight text-slate-900">{t('modals.requestTitle')}</h3>
        <label className="mt-4 block">
          <span className="text-xs uppercase tracking-wide text-slate-500">{t('modals.requestLabel')}</span>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('modals.requestPlaceholder')}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            {t('shared.cancel')}
          </Button>
          <Button variant="secondary" disabled={!message.trim()} onClick={() => onSubmit(message.trim())}>
            {t('modals.sendRequest')}
          </Button>
        </div>
      </div>
    </div>
  )
}
