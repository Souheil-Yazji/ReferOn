import { useTranslation } from '../../i18n/useTranslation'

const STATUS_TEXT = {
  draft: 'text-slate-600',
  previewed: 'text-blue-700',
  selected_specialist: 'text-purple-700',
  pending: 'text-yellow-800',
  sent: 'text-blue-700',
  more_info_requested: 'text-orange-800',
  approved: 'text-green-700',
  rejected: 'text-red-700',
}

const STATUS_BG = {
  draft: 'bg-status-draft',
  previewed: 'bg-status-previewed',
  selected_specialist: 'bg-status-selected_specialist',
  pending: 'bg-status-pending',
  sent: 'bg-status-sent',
  more_info_requested: 'bg-status-more_info_requested',
  approved: 'bg-status-approved',
  rejected: 'bg-status-rejected',
}

export default function ReferralStatusBadge({ status }) {
  const { t } = useTranslation()
  const label = t(`status.${status}`)

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BG[status]} ${STATUS_TEXT[status]}`}
    >
      {label === `status.${status}` ? status : label}
    </span>
  )
}
