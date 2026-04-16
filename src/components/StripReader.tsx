import { useState } from 'react'
import { Pipette, ChevronLeft } from 'lucide-react'
import { GlassCard } from './GlassCard'
import { TEST_STRIP_STEPS, OPTIMAL_RANGES, formatSwedishDecimal } from '../constants'

function isOptimal(key: string, value: number): boolean {
  const range = OPTIMAL_RANGES.find((r) => r.key === key)
  if (!range) return false
  const aboveMin = range.min === undefined || value >= range.min
  const belowMax = range.max === undefined || value <= range.max
  return aboveMin && belowMax
}

interface StripReaderResult {
  freeChlorine: number
  ph: number
  totalAlkalinity: number
}

export function StripReader({ onComplete, onCancel }: {
  onComplete: (values: StripReaderResult) => void
  onCancel: () => void
}) {
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<(number | null)[]>([null, null, null])

  const current = TEST_STRIP_STEPS[step]

  function handleSelect(value: number) {
    const next = [...selected]
    next[step] = value
    setSelected(next)

    if (step < 2) {
      setTimeout(() => setStep(step + 1), 300)
    } else {
      setTimeout(() => {
        onComplete({
          freeChlorine: next[0]!,
          ph: next[1]!,
          totalAlkalinity: next[2]!,
        })
      }, 300)
    }
  }

  function handleBack() {
    if (step > 0) {
      setStep(step - 1)
    } else {
      onCancel()
    }
  }

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={handleBack}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 rounded-full hover:bg-charcoal-hover transition-colors"
          aria-label="Tillbaka"
        >
          <ChevronLeft size={20} className="text-charcoal" strokeWidth={1.75} />
        </button>
        <div className="flex items-center gap-1.5">
          <Pipette size={14} className="text-charcoal" strokeWidth={1.75} />
          <span className="text-[11px] text-charcoal-muted font-medium uppercase tracking-[1.5px]">
            Avläs teststicka
          </span>
        </div>
        <div className="w-[44px]" />
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {TEST_STRIP_STEPS.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              i === step
                ? 'bg-charcoal'
                : i < step
                  ? 'bg-charcoal/50'
                  : 'bg-charcoal/15'
            }`}
          />
        ))}
      </div>

      {/* Current step */}
      <div className="text-center mb-1">
        <div className="text-base text-charcoal font-semibold tracking-tight">{current.label}</div>
        <div className="text-[11px] text-charcoal-muted mt-0.5">
          Välj den färg som matchar din teststicka
        </div>
      </div>

      {/* Optimal range hint */}
      {(() => {
        const range = OPTIMAL_RANGES.find((r) => r.key === current.key)
        if (!range) return null
        const min = range.min !== undefined ? formatSwedishDecimal(range.min) : null
        const max = range.max !== undefined ? formatSwedishDecimal(range.max) : null
        return (
          <div className="text-center text-[11px] text-status-ok font-medium mb-3">
            Optimalt: {min && max ? `${min}–${max}` : max ? `< ${max}` : `> ${min}`}
            {current.unit ? ` ${current.unit}` : ''}
          </div>
        )
      })()}

      {/* Color swatches */}
      <div className="flex justify-center gap-2 flex-wrap mb-3">
        {current.values.map((item) => {
          const optimal = isOptimal(current.key, item.value)
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => handleSelect(item.value)}
              className="flex flex-col items-center gap-1 transition-transform duration-150 active:scale-95"
            >
              <div
                className={`w-[48px] h-[48px] rounded-xl border-2 transition-all duration-200 ${
                  selected[step] === item.value
                    ? 'border-charcoal ring-2 ring-charcoal/40 ring-offset-2 ring-offset-cream scale-110'
                    : optimal
                      ? 'border-status-ok/60'
                      : 'border-cream-border'
                }`}
                style={{ backgroundColor: item.color }}
              />
              <span
                className={`text-[10px] font-medium tabular-nums ${
                  optimal ? 'text-status-ok' : 'text-charcoal-muted'
                }`}
              >
                {formatSwedishDecimal(item.value)}
                {current.unit ? ` ${current.unit}` : ''}
              </span>
            </button>
          )
        })}
      </div>

      {/* Step count */}
      <div className="text-center text-[11px] text-charcoal-muted tabular-nums">
        Steg {step + 1} av 3
      </div>
    </GlassCard>
  )
}
