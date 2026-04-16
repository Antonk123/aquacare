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
    const volumeFactor = DEFAULT_SETTINGS.waterVolume / 1000
    const amount = Math.round(steps * formula.dosagePerUnit * volumeFactor)
    const maxDose = Math.round(formula.maxPerApplication * volumeFactor)
    if (amount > 0) {
      if (amount > maxDose) {
        dosage = `Tillsätt max ${maxDose}${formula.unit} ${formula.product.toLowerCase()}, vänta och testa igen.`
      } else {
        dosage = `Tillsätt ${amount}${formula.unit} ${formula.product.toLowerCase()}.`
      }
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
        <div className="inline-flex items-center justify-center w-[72px] h-[72px] rounded-full bg-cream border border-cream-border mb-3">
          <Droplets size={28} className="text-charcoal-muted" strokeWidth={1.75} />
        </div>
        <div className="text-base text-charcoal font-medium tracking-tight">
          Välkommen till AquaCare
        </div>
        <div className="text-xs text-charcoal-muted mt-1">Logga ditt första vattentest</div>
      </div>
    )
  }

  const rec = getRecommendation(latest)

  if (!rec) {
    return (
      <div className="text-center py-4">
        <div className="inline-flex items-center justify-center w-[72px] h-[72px] rounded-full bg-status-ok/10 border border-status-ok/30 mb-3">
          <Check size={30} className="text-status-ok" strokeWidth={2.2} />
        </div>
        <div className="text-base text-status-ok font-semibold tracking-tight">
          Vattnet mår bra
        </div>
        <div className="text-[11px] text-charcoal-muted mt-1">
          Senast testad · {formatTimeAgo(latest.date)}
        </div>
      </div>
    )
  }

  const isError = rec.level === 'error'
  const Icon = isError ? AlertCircle : AlertTriangle
  const containerCls = isError
    ? 'bg-status-error/10 border-status-error/30'
    : 'bg-status-warn/10 border-status-warn/30'
  const textCls = isError ? 'text-status-error' : 'text-status-warn'

  return (
    <div className="text-center py-4">
      <div
        className={`inline-flex items-center justify-center w-[72px] h-[72px] rounded-full border mb-3 ${containerCls}`}
      >
        <Icon size={28} className={textCls} strokeWidth={2} />
      </div>
      <div className={`text-base font-semibold tracking-tight ${textCls}`}>
        {rec.label} är {rec.direction}
      </div>
      {rec.dosage && (
        <div className="text-sm text-charcoal mt-2 font-medium">{rec.dosage}</div>
      )}
      {rec.instruction && (
        <div className="text-[11px] text-charcoal-muted mt-1">{rec.instruction}</div>
      )}
      <div className="text-[11px] text-charcoal-muted mt-2">
        Baserat på test · {formatTimeAgo(latest.date)}
      </div>
    </div>
  )
}
