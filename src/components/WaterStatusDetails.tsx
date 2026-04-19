import { useEffect } from 'react'
import { X, AlertCircle, AlertTriangle, Check, Calculator } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { WaterLogEntry, OptimalRange, ValueStatus } from '../types'
import { OPTIMAL_RANGES, CALCULATOR_FORMULAS, getValueStatus } from '../constants'

interface Issue {
  range: OptimalRange
  value: number
  status: Exclude<ValueStatus, 'ok'>
  direction: 'high' | 'low'
  dosage: string | null
  instruction: string | null
}

function fmt(v: number, decimals = 1): string {
  return v.toFixed(decimals).replace('.', ',')
}

function formatRange(range: OptimalRange): string {
  const decimals = range.key === 'totalAlkalinity' ? 0 : 1
  if (range.min != null && range.max != null) {
    return `${fmt(range.min, decimals)}–${fmt(range.max, decimals)}${range.unit ? ' ' + range.unit : ''}`
  }
  if (range.max != null) return `max ${fmt(range.max, decimals)}${range.unit ? ' ' + range.unit : ''}`
  if (range.min != null) return `min ${fmt(range.min, decimals)}${range.unit ? ' ' + range.unit : ''}`
  return '—'
}

function buildIssues(entry: WaterLogEntry, waterVolume: number): Issue[] {
  const issues: Issue[] = []
  for (const range of OPTIMAL_RANGES.slice(0, 3)) {
    const val = entry[range.key] as number | undefined
    if (val === undefined) continue
    const status = getValueStatus(range, val)
    if (status === 'ok') continue

    const tooHigh = range.max !== undefined && val > range.max
    const direction: 'high' | 'low' = tooHigh ? 'high' : 'low'

    let actionType: string | null = null
    if (range.key === 'ph') actionType = tooHigh ? 'lower-ph' : 'raise-ph'
    else if (range.key === 'freeChlorine') actionType = tooHigh ? null : 'add-chlorine'
    else if (range.key === 'totalAlkalinity') actionType = tooHigh ? 'lower-alkalinity' : 'raise-alkalinity'

    const formula = actionType ? CALCULATOR_FORMULAS.find((f) => f.action === actionType) : null
    let dosage: string | null = null
    if (formula) {
      const target = tooHigh ? (range.max ?? val) : (range.min ?? val)
      const diff = Math.abs(val - target)
      const steps = diff / formula.changeStep
      const volumeFactor = waterVolume / 1000
      const amount = Math.round(steps * formula.dosagePerUnit * volumeFactor)
      const maxDose = Math.round(formula.maxPerApplication * volumeFactor)
      if (amount > 0) {
        if (amount > maxDose) {
          dosage = `Tillsätt max ${maxDose}${formula.unit} ${formula.product.toLowerCase()}, vänta och testa igen.`
        } else {
          dosage = `Tillsätt ${amount}${formula.unit} ${formula.product.toLowerCase()}.`
        }
      }
    } else if (tooHigh && range.key === 'freeChlorine') {
      dosage = 'Vänta tills klor sjunker naturligt, eller gör delvis vattenbyte.'
    }

    issues.push({
      range,
      value: val,
      status,
      direction,
      dosage,
      instruction: formula?.instruction ?? null,
    })
  }
  return issues
}

interface WaterStatusDetailsProps {
  latest: WaterLogEntry | undefined
  waterVolume: number
  onClose: () => void
}

export function WaterStatusDetails({ latest, waterVolume, onClose }: WaterStatusDetailsProps) {
  const navigate = useNavigate()

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const issues = latest ? buildIssues(latest, waterVolume) : []
  const hasError = issues.some((i) => i.status === 'error')
  const hasWarn = issues.some((i) => i.status === 'warn')

  const headerLabel = hasError ? 'Behöver omsorg' : hasWarn ? 'Nära gräns' : 'I balans'
  const headerColor = hasError ? 'var(--color-status-error)' : hasWarn ? 'var(--color-status-warn)' : 'var(--color-status-ok)'

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Vattenstatus i detalj"
        className="relative bg-cream-light border border-cream-border rounded-t-[24px] sm:rounded-2xl w-full max-w-md max-h-[85dvh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle (mobile) */}
        <div className="flex justify-center pt-2 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-cream-border" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-cream-border">
          <div>
            <div className="spa-label !text-[9px]" style={{ letterSpacing: '0.12em' }}>Vattenstatus</div>
            <h2 className="spa-heading text-[20px] text-charcoal mt-0.5" style={{ color: headerColor }}>
              {headerLabel}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Stäng"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-cream border border-cream-border text-charcoal-muted active:scale-95 transition-transform"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {!latest && (
            <div className="text-center py-6">
              <div className="text-sm text-charcoal-muted">Logga ett vattentest för att se status.</div>
            </div>
          )}

          {latest && issues.length === 0 && (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-[56px] h-[56px] rounded-full bg-status-ok/10 border border-status-ok/30 mb-3">
                <Check size={24} className="text-status-ok" strokeWidth={2.2} />
              </div>
              <div className="text-[15px] text-charcoal font-medium">Alla värden inom mål</div>
              <div className="text-[12px] text-charcoal-muted mt-1">Fortsätt med dagliga rutiner.</div>
            </div>
          )}

          {issues.map((issue) => {
            const Icon = issue.status === 'error' ? AlertCircle : AlertTriangle
            const tone = issue.status === 'error' ? 'var(--color-status-error)' : 'var(--color-status-warn)'
            const decimals = issue.range.key === 'totalAlkalinity' ? 0 : 1
            const directionLabel = issue.direction === 'high' ? 'för högt' : 'för lågt'

            return (
              <div key={issue.range.key} className="spa-card !p-3.5">
                <div className="flex items-start gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `color-mix(in oklch, ${tone} 12%, transparent)`, border: `1px solid color-mix(in oklch, ${tone} 30%, transparent)` }}
                  >
                    <Icon size={16} style={{ color: tone }} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="font-display text-[15px] text-charcoal">
                        {issue.range.label} är {directionLabel}
                      </div>
                      <div className="spa-mono text-[13px] text-charcoal">
                        {fmt(issue.value, decimals)}{issue.range.unit && <span className="text-charcoal-whisper ml-0.5">{issue.range.unit}</span>}
                      </div>
                    </div>
                    <div className="text-[11px] text-charcoal-muted mt-0.5">
                      Målområde {formatRange(issue.range)}
                    </div>
                    {issue.dosage && (
                      <div className="mt-2 text-[13px] text-charcoal font-medium leading-snug">
                        {issue.dosage}
                      </div>
                    )}
                    {issue.instruction && (
                      <div className="text-[11px] text-charcoal-muted mt-1 leading-snug">
                        {issue.instruction}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {issues.length > 0 && (
            <div className="text-[10.5px] text-charcoal-whisper px-1 leading-snug">
              Doserna är riktlinjer baserade på {waterVolume} L. Följ alltid produktens datablad.
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 border-t border-cream-border flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 min-h-[44px] bg-charcoal-hover border border-cream-border text-charcoal rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform"
          >
            Stäng
          </button>
          <button
            onClick={() => {
              onClose()
              navigate('/kalkyl')
            }}
            className="flex-1 min-h-[44px] bg-charcoal text-cream-light rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5"
          >
            <Calculator size={15} strokeWidth={2} />
            Kalkylator
          </button>
        </div>
      </div>
    </div>
  )
}
