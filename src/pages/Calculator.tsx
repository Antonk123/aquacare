import { useState, useEffect } from 'react'
import { ChevronDown, Calculator as CalcIcon } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { CALCULATOR_FORMULAS, DEFAULT_SETTINGS } from '../constants'
import { api } from '../lib/api'
import type { CalculatorAction } from '../types'

const INPUT_CLS =
  'w-full bg-cream-light border border-cream-border rounded-md px-3.5 min-h-[48px] text-base text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:shadow-focus-warm transition-shadow duration-200'

const LABEL_CLS = 'block text-[12px] text-charcoal-muted mb-1.5 font-medium tracking-tight'

export default function Calculator() {
  const [action, setAction] = useState<CalculatorAction>('raise-ph')
  const [current, setCurrent] = useState('')
  const [target, setTarget] = useState('')
  const [volume, setVolume] = useState(String(DEFAULT_SETTINGS.waterVolume))
  const [showDropdown, setShowDropdown] = useState(false)
  const [result, setResult] = useState<{ amount: number; formula: typeof CALCULATOR_FORMULAS[0]; maxDose: number; exceeds: boolean } | null>(null)
  const [tubs, setTubs] = useState<{ id: string; name: string; volume: number }[]>([])
  const [selectedTubId, setSelectedTubId] = useState<string>('')

  useEffect(() => {
    api.listTubs().then((rows) =>
      setTubs(rows.map((t) => ({ id: t.id, name: t.name, volume: t.volume })))
    ).catch(() => {})
  }, [])

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
    const volumeFactor = volumeVal / 1000
    const totalAmount = Math.round(steps * activeFormula.dosagePerUnit * volumeFactor)
    const maxDose = Math.round(activeFormula.maxPerApplication * volumeFactor)
    const exceeds = totalAmount > maxDose

    setResult({ amount: Math.max(0, totalAmount), formula: activeFormula, maxDose, exceeds })
  }

  const needsTarget = action !== 'shock'

  return (
    <div className="p-5 space-y-4">
      <h1 className="font-display text-[28px] leading-none font-semibold text-charcoal tracking-[-0.035em]">
        Kalkylator
      </h1>

      <form onSubmit={calculate} className="space-y-4">
        <div>
          <label className={LABEL_CLS}>Vad vill du justera?</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full bg-cream-light border border-cream-border rounded-md px-3.5 min-h-[48px] text-[14px] text-charcoal flex items-center justify-between tracking-tight transition-shadow focus:shadow-focus-warm"
            >
              {activeFormula.label}
              <ChevronDown
                size={16}
                className={`text-charcoal-muted transition-transform ${
                  showDropdown ? 'rotate-180' : ''
                }`}
                strokeWidth={1.75}
              />
            </button>
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-cream-light border border-cream-border rounded-md overflow-hidden z-10 shadow-focus-warm">
                {CALCULATOR_FORMULAS.map((f) => (
                  <button
                    key={f.action}
                    type="button"
                    onClick={() => {
                      setAction(f.action)
                      setShowDropdown(false)
                      setResult(null)
                    }}
                    className={`w-full text-left px-3.5 min-h-[44px] text-[14px] flex items-center transition-colors duration-150 tracking-tight ${
                      f.action === action
                        ? 'text-charcoal bg-charcoal-hover font-medium'
                        : 'text-charcoal hover:bg-charcoal-whisper'
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
              <label className={LABEL_CLS}>
                Nuvarande {action.includes('ph') ? 'pH' : 'värde'}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder={action.includes('ph') ? '7,0' : '75'}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>
                Målvärde {action.includes('ph') ? 'pH' : ''}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={action.includes('ph') ? '7,4' : '100'}
                className={INPUT_CLS}
              />
            </div>
          </div>
        ) : null}

        {tubs.length > 0 && (
          <div>
            <label className="block text-xs text-charcoal-muted mb-1.5 font-medium">
              Bad <span className="text-charcoal-muted">(valfritt)</span>
            </label>
            <select
              value={selectedTubId}
              onChange={(e) => {
                const id = e.target.value
                setSelectedTubId(id)
                if (id) {
                  const tub = tubs.find((t) => t.id === id)
                  if (tub) setVolume(String(tub.volume))
                } else {
                  setVolume(String(DEFAULT_SETTINGS.waterVolume))
                }
              }}
              className="w-full bg-cream-light border border-cream-border rounded-md px-3.5 min-h-[48px] text-base text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:shadow-focus-warm transition-shadow duration-200"
            >
              <option value="">Välj bad (valfritt)</option>
              {tubs.map((tub) => (
                <option key={tub.id} value={tub.id}>
                  {tub.name} ({tub.volume} L)
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className={LABEL_CLS}>Vattenvolym</label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className={`${INPUT_CLS} pr-14`}
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] text-charcoal-muted">
              liter
            </span>
          </div>
          <p className="text-[11px] text-charcoal-muted mt-1">
            {selectedTubId ? 'Förifyllt från valt bad' : `Förifyllt för ${DEFAULT_SETTINGS.spaName}`}
          </p>
        </div>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 w-full min-h-[48px] bg-charcoal text-cream-light rounded-md font-medium text-[15px] tracking-tight shadow-inset-btn transition-opacity duration-200 active:opacity-80"
        >
          <CalcIcon size={18} strokeWidth={2} />
          Beräkna
        </button>
      </form>

      {result && (
        <>
          {result.exceeds ? (
            <GlassCard className="bg-status-alert/5 border-status-alert/20 text-center">
              <div className="text-[11px] text-status-alert uppercase tracking-[1.5px] font-medium mb-2">Stor justering — dosera i omgångar</div>
              <div className="text-sm text-charcoal-muted mb-3">
                Total beräknad mängd: <span className="font-medium text-charcoal">{result.amount} {result.formula.unit}</span>
              </div>
              <div className="text-[32px] font-semibold text-status-alert tracking-[-0.03em] tabular-nums leading-none">
                Max {result.maxDose} {result.formula.unit}
              </div>
              <div className="text-xs text-charcoal-muted mt-1">per tillfälle</div>
              <div className="text-sm text-charcoal mt-2 font-medium">{result.formula.product}</div>
              <div className="text-[11px] text-charcoal-muted mt-2">{result.formula.instruction}</div>
              <div className="text-[11px] text-status-alert/80 mt-3">
                Tillsätt max {result.maxDose}{result.formula.unit}, vänta, testa igen. Upprepa tills målvärdet nås.
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="bg-status-ok/5 border-status-ok/20 text-center">
              <div className="text-[11px] text-charcoal-muted uppercase tracking-[1.5px] font-medium mb-2">Tillsätt i ditt spa</div>
              <div className="text-[40px] font-semibold text-status-ok tracking-[-0.03em] tabular-nums leading-none">
                {result.amount} {result.formula.unit}
              </div>
              <div className="text-sm text-charcoal mt-2 font-medium">{result.formula.product}</div>
              <div className="text-[11px] text-charcoal-muted mt-2">{result.formula.instruction}</div>
            </GlassCard>
          )}
        </>
      )}

      <div className="text-[10px] text-charcoal-muted text-center px-4">
        Beräkningarna är ungefärliga riktlinjer. Faktisk dosering varierar beroende på produkt och vattnets kemi. Följ alltid produktens datablad.
      </div>
    </div>
  )
}
