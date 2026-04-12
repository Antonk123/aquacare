import { Check, AlertTriangle, AlertCircle, Droplets } from 'lucide-react'
import type { WaterLogEntry } from '../types'
import { OPTIMAL_RANGES, CALCULATOR_FORMULAS, getValueStatus, DEFAULT_SETTINGS } from '../constants'

function getRecommendation(entry: WaterLogEntry) {
  let worstKey: string | null = null
  let worstLevel: 'warn' | 'error' | null = null
  let worstValue = 0
  let worstRange: typeof OPTIMAL_RANGES[0] | null = null

  for (const range of OPTIMAL_RANGES) {
    const val = entry[range.key] as number | undefined
    if (val === undefined) continue
    const status = getValueStatus(range, val)
    if (status === 'error' && worstLevel !== 'error') {
      worstLevel = 'error'
      worstKey = range.key
      worstValue = val
      worstRange = range
    } else if (status === 'warn' && !worstLevel) {
      worstLevel = 'warn'
      worstKey = range.key
      worstValue = val
      worstRange = range
    }
  }

  if (!worstKey || !worstRange || !worstLevel) return null

  const tooHigh = worstRange.max !== undefined && worstValue > worstRange.max
  const tooLow = worstRange.min !== undefined && worstValue < worstRange.min

  let actionType: string | null = null
  if (worstKey === 'ph') actionType = tooHigh ? 'lower-ph' : 'raise-ph'
  else if (worstKey === 'freeChlorine') actionType = tooLow ? 'add-chlorine' : null
  else if (worstKey === 'totalAlkalinity') actionType = tooHigh ? 'lower-alkalinity' : 'raise-alkalinity'

  const formula = actionType ? CALCULATOR_FORMULAS.find((f) => f.action === actionType) : null

  let dosage: string | null = null
  if (formula && worstRange) {
    const target = tooHigh ? (worstRange.max ?? worstValue) : (worstRange.min ?? worstValue)
    const diff = Math.abs(worstValue - target)
    const steps = diff / formula.changeStep
    const amount = Math.round(steps * formula.dosagePerUnit * (DEFAULT_SETTINGS.waterVolume / 1000))
    if (amount > 0) {
      dosage = `Tillsätt ${amount}${formula.unit} ${formula.product.toLowerCase()}.`
    }
  }

  return {
    level: worstLevel,
    label: worstRange.label,
    direction: tooHigh ? 'för högt' : 'för lågt',
    dosage,
    instruction: formula?.instruction ?? null,
  }
}

function formatTimeAgo(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0]
  const dateStr = iso.split('T')[0]
  const time = date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })

  if (dateStr === today) return `Idag ${time}`
  if (dateStr === yesterday) return `Igår ${time}`
  return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
}

export function SmartStatus({ latest }: { latest: WaterLogEntry | undefined }) {
  if (!latest) {
    return (
      <div className="text-center py-6">
        <div className="inline-flex items-center justify-center w-[72px] h-[72px] rounded-full bg-glass-surface border-2 border-glass-border mb-3">
          <Droplets size={28} className="text-slate-400" />
        </div>
        <div className="text-sm text-slate-300 font-medium">Välkommen till AquaCare</div>
        <div className="text-xs text-slate-500 mt-1">Logga ditt första vattentest</div>
      </div>
    )
  }

  const rec = getRecommendation(latest)

  if (!rec) {
    return (
      <div className="text-center py-4">
        <div className="inline-flex items-center justify-center w-[72px] h-[72px] rounded-full bg-gradient-to-br from-status-ok/15 to-status-ok/5 border-2 border-status-ok/30 mb-3 shadow-[0_0_24px_rgba(74,222,128,0.1)]">
          <Check size={32} className="text-status-ok" strokeWidth={2.5} />
        </div>
        <div className="text-sm text-status-ok font-semibold">Vattnet mår bra</div>
        <div className="text-xs text-slate-500 mt-1">Senast testad · {formatTimeAgo(latest.date)}</div>
      </div>
    )
  }

  const isError = rec.level === 'error'
  const color = isError ? 'status-error' : 'status-warn'
  const glowColor = isError ? 'rgba(248,113,113,0.1)' : 'rgba(251,191,36,0.1)'
  const Icon = isError ? AlertCircle : AlertTriangle

  return (
    <div className="text-center py-4">
      <div
        className={`inline-flex items-center justify-center w-[72px] h-[72px] rounded-full bg-gradient-to-br from-${color}/15 to-${color}/5 border-2 border-${color}/30 mb-3`}
        style={{ boxShadow: `0 0 24px ${glowColor}` }}
      >
        <Icon size={28} className={`text-${color}`} />
      </div>
      <div className={`text-sm text-${color} font-semibold`}>{rec.label} är {rec.direction}</div>
      {rec.dosage && (
        <div className="text-sm text-slate-200 mt-2">{rec.dosage}</div>
      )}
      {rec.instruction && (
        <div className="text-[11px] text-slate-400 mt-1">{rec.instruction}</div>
      )}
      <div className="text-[11px] text-slate-500 mt-2">Baserat på test · {formatTimeAgo(latest.date)}</div>
    </div>
  )
}
