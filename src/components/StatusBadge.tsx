import { Check, AlertTriangle, AlertCircle } from 'lucide-react'
import type { ValueStatus } from '../types'

const config: Record<ValueStatus, { label: string; bg: string; text: string; Icon: typeof Check }> = {
  ok: { label: 'Optimalt', bg: 'bg-status-ok/15', text: 'text-status-ok', Icon: Check },
  warn: { label: 'Varning', bg: 'bg-status-warn/15', text: 'text-status-warn', Icon: AlertTriangle },
  error: { label: 'Kritiskt', bg: 'bg-status-error/15', text: 'text-status-error', Icon: AlertCircle },
}

export function StatusBadge({ status }: { status: ValueStatus }) {
  const { label, bg, text, Icon } = config[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${bg} ${text}`}>
      <Icon size={12} />
      {label}
    </span>
  )
}
