import { AlertTriangle } from 'lucide-react'
import type { ValueStatus } from '../types'
import { formatSwedishDecimal } from '../constants'

const statusColors: Record<ValueStatus, string> = {
  ok: 'bg-status-ok/8 text-status-ok',
  warn: 'bg-status-warn/8 text-status-warn',
  error: 'bg-status-error/10 text-status-error',
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
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs ${statusColors[status]}`}>
      {label} {formatSwedishDecimal(value)}
      {status !== 'ok' && <AlertTriangle size={10} />}
    </span>
  )
}
