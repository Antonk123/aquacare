import { AlertTriangle } from 'lucide-react'
import type { ValueStatus } from '../types'
import { formatSwedishDecimal } from '../constants'

const statusStyles: Record<ValueStatus, string> = {
  ok: 'border-cream-border text-charcoal bg-cream',
  warn: 'border-status-warn/30 text-status-warn bg-status-warn/10',
  error: 'border-status-error/30 text-status-error bg-status-error/10',
}

export function ValueBadge({
  label,
  value,
  status,
}: {
  label: string
  value: number
  status: ValueStatus
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-normal border ${statusStyles[status]}`}
    >
      <span className="text-charcoal-muted">{label}</span>
      <span className="font-medium tabular-nums">{formatSwedishDecimal(value)}</span>
      {status !== 'ok' && <AlertTriangle size={10} strokeWidth={2.2} />}
    </span>
  )
}
