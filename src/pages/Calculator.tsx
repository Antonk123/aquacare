import { useState } from 'react'
import { ChevronDown, Calculator as CalcIcon } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { CALCULATOR_FORMULAS, DEFAULT_SETTINGS } from '../constants'
import type { CalculatorAction } from '../types'

export default function Calculator() {
  const [action, setAction] = useState<CalculatorAction>('raise-ph')
  const [current, setCurrent] = useState('')
  const [target, setTarget] = useState('')
  const [volume, setVolume] = useState(String(DEFAULT_SETTINGS.waterVolume))
  const [showDropdown, setShowDropdown] = useState(false)
  const [result, setResult] = useState<{ amount: number; formula: typeof CALCULATOR_FORMULAS[0] } | null>(null)

  const activeFormula = CALCULATOR_FORMULAS.find((f) => f.action === action)!

  function calculate(e: React.FormEvent) {
    e.preventDefault()
    const currentVal = Number(current.replace(',', '.'))
    const targetVal = Number(target.replace(',', '.'))
    const volumeVal = Number(volume.replace(',', '.'))

    if (isNaN(currentVal) || isNaN(volumeVal)) return

    let diff: number
    if (action === 'shock') {
      diff = 1
    } else if (action === 'add-chlorine') {
      diff = targetVal - currentVal
    } else {
      diff = Math.abs(targetVal - currentVal)
    }

    const steps = diff / activeFormula.changeStep
    const amount = Math.round(steps * activeFormula.dosagePerUnit * (volumeVal / 1000))

    setResult({ amount: Math.max(0, amount), formula: activeFormula })
  }

  const needsTarget = action !== 'shock'

  return (
    <div className="p-5 space-y-4">
      <h1 className="font-display text-xl text-gold font-bold">Kalkylator</h1>

      <form onSubmit={calculate} className="space-y-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Vad vill du justera?</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full bg-glass-surface backdrop-blur-[12px] border border-glass-border rounded-xl px-3.5 min-h-[48px] text-sm text-slate-200 flex items-center justify-between"
            >
              {activeFormula.label}
              <ChevronDown size={16} className="text-slate-500" />
            </button>
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-navy-light border border-glass-border rounded-xl overflow-hidden z-10 shadow-xl">
                {CALCULATOR_FORMULAS.map((f) => (
                  <button
                    key={f.action}
                    type="button"
                    onClick={() => {
                      setAction(f.action)
                      setShowDropdown(false)
                      setResult(null)
                    }}
                    className={`w-full text-left px-3.5 min-h-[44px] text-sm flex items-center transition-colors duration-150 ${
                      f.action === action ? 'text-gold bg-gold/10' : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {needsTarget ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                Nuvarande {action.includes('ph') ? 'pH' : 'värde'}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder={action.includes('ph') ? '7,0' : '75'}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-gold/40 transition-colors duration-200"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                Målvärde {action.includes('ph') ? 'pH' : ''}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={action.includes('ph') ? '7,4' : '100'}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-gold/40 transition-colors duration-200"
              />
            </div>
          </div>
        ) : null}

        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Vattenvolym</label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 pr-14 min-h-[48px] text-base text-slate-200 focus:outline-none focus:border-gold/40 transition-colors duration-200"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] text-slate-500">liter</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1">Förifyllt för {DEFAULT_SETTINGS.spaName}</p>
        </div>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 w-full min-h-[48px] bg-gradient-to-br from-gold to-gold-dark text-navy rounded-[14px] font-bold text-[15px] tracking-wide shadow-[0_4px_16px_rgba(232,201,122,0.2)] transition-transform duration-200 active:scale-[0.98]"
        >
          <CalcIcon size={18} strokeWidth={2.5} />
          Beräkna
        </button>
      </form>

      {result && (
        <GlassCard className="!bg-status-ok/6 !border-status-ok/15 text-center">
          <div className="text-[11px] text-slate-400 uppercase tracking-widest mb-2">Tillsätt i ditt spa</div>
          <div className="text-4xl font-bold text-status-ok">
            {result.amount} {result.formula.unit}
          </div>
          <div className="text-sm text-slate-300 mt-1">{result.formula.product}</div>
          <div className="text-[11px] text-slate-500 mt-2">{result.formula.instruction}</div>
        </GlassCard>
      )}
    </div>
  )
}
