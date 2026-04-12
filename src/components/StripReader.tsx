import { useState } from 'react'
import { Pipette, ChevronLeft } from 'lucide-react'
import { GlassCard } from './GlassCard'
import { TEST_STRIP_STEPS, formatSwedishDecimal } from '../constants'

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
          className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2"
          aria-label="Tillbaka"
        >
          <ChevronLeft size={20} className="text-slate-400" />
        </button>
        <div className="flex items-center gap-1.5">
          <Pipette size={14} className="text-gold" />
          <span className="text-xs text-gold font-semibold uppercase tracking-wider">Avläs teststicka</span>
        </div>
        <div className="w-[44px]" />
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {TEST_STRIP_STEPS.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              i === step ? 'bg-gold' : i < step ? 'bg-gold/40' : 'bg-white/15'
            }`}
          />
        ))}
      </div>

      {/* Current step */}
      <div className="text-center mb-4">
        <div className="text-sm text-slate-200 font-medium">{current.label}</div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Välj den färg som matchar din teststicka
        </div>
      </div>

      {/* Color swatches */}
      <div className="flex justify-center gap-2 flex-wrap mb-3">
        {current.values.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => handleSelect(item.value)}
            className={`flex flex-col items-center gap-1.5 transition-transform duration-150 active:scale-95`}
          >
            <div
              className={`w-[48px] h-[48px] rounded-xl border-2 transition-all duration-200 ${
                selected[step] === item.value
                  ? 'border-gold ring-2 ring-gold ring-offset-2 ring-offset-navy scale-110'
                  : 'border-white/20'
              }`}
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[10px] text-slate-400 font-medium">
              {formatSwedishDecimal(item.value)}
              {current.unit ? ` ${current.unit}` : ''}
            </span>
          </button>
        ))}
      </div>

      {/* Step count */}
      <div className="text-center text-[11px] text-slate-500">
        Steg {step + 1} av 3
      </div>
    </GlassCard>
  )
}
