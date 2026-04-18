import { useState, useEffect } from 'react'
import { CALCULATOR_FORMULAS, DEFAULT_SETTINGS } from '../constants'
import { api } from '../lib/api'
import type { CalculatorAction } from '../types'

function fmt(v: number, decimals = 1): string {
  return v.toFixed(decimals).replace('.', ',')
}

const ACTIONS = [
  { id: 'raise-ph' as CalculatorAction, label: 'Höja pH', product: 'Natriumkarbonat' },
  { id: 'lower-ph' as CalculatorAction, label: 'Sänka pH', product: 'Natriumbisulfat' },
  { id: 'raise-alkalinity' as CalculatorAction, label: 'Höja alkalinitet', product: 'Natriumbikarbonat' },
  { id: 'shock' as CalculatorAction, label: 'Chockbehandling', product: 'Klorchock 65%' },
]

export default function Calculator() {
  const [action, setAction] = useState<CalculatorAction>('raise-ph')
  const [current, setCurrent] = useState(7.2)
  const [target, setTarget] = useState(7.4)
  const [volume, setVolume] = useState(DEFAULT_SETTINGS.waterVolume)
  const [tubs, setTubs] = useState<{ id: string; name: string; volume: number }[]>([])
  const [selectedTubId, setSelectedTubId] = useState('')

  useEffect(() => {
    api.listTubs().then((rows) =>
      setTubs(rows.map((t: any) => ({ id: t.id, name: t.name, volume: t.volume })))
    ).catch(() => {})
  }, [])

  const activeFormula = CALCULATOR_FORMULAS.find((f) => f.action === action)!
  const delta = Math.max(0, Math.abs(target - current))
  const steps = action === 'shock' ? 1 : delta / activeFormula.changeStep
  const volumeFactor = volume / 1000
  const dose = Math.round(steps * activeFormula.dosagePerUnit * volumeFactor)
  const maxDose = Math.round(activeFormula.maxPerApplication * volumeFactor)
  const exceeds = dose > maxDose

  return (
    <div className="px-4 pb-4 space-y-4">
      {/* Header */}
      <div className="px-1 pt-2 pb-2">
        <div className="spa-label">Kalkylator</div>
        <h1 className="spa-heading text-[32px] mt-1.5 text-charcoal">
          Dosering<span className="text-accent">.</span>
        </h1>
      </div>

      {/* Action grid — 2×2 */}
      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            onClick={() => setAction(a.id)}
            className="spa-card text-left !p-3.5 transition-all duration-200"
            style={{
              background: action === a.id ? 'var(--color-charcoal)' : undefined,
              color: action === a.id ? 'var(--color-cream)' : undefined,
              borderColor: action === a.id ? 'var(--color-charcoal)' : undefined,
            }}
          >
            <div className="font-display text-[16px]" style={{ fontWeight: 400, letterSpacing: '-0.01em' }}>
              {a.label}
            </div>
            <div className="font-body text-[10px] mt-0.5 opacity-60" style={{ letterSpacing: '0.05em' }}>
              {a.product}
            </div>
          </button>
        ))}
      </div>

      {/* Tub selector */}
      {tubs.length > 0 && (
        <div className="flex gap-1.5">
          {tubs.map((tub) => (
            <button
              key={tub.id}
              onClick={() => {
                setSelectedTubId(tub.id)
                setVolume(tub.volume)
              }}
              className={selectedTubId === tub.id ? 'spa-pill spa-pill-active' : 'spa-pill spa-pill-inactive'}
            >
              {tub.name} · {tub.volume}L
            </button>
          ))}
        </div>
      )}

      {/* Current → Target */}
      {action !== 'shock' && (
        <div className="spa-card !p-4 space-y-3.5">
          <div className="flex justify-between">
            <div>
              <div className="spa-label !text-[10px]">Nuvarande</div>
              <div className="spa-value text-[32px] mt-0.5" style={{ fontWeight: 300, letterSpacing: '-0.03em' }}>
                {fmt(current, 1)}
              </div>
            </div>
            <div className="text-[20px] text-charcoal-whisper self-center">→</div>
            <div className="text-right">
              <div className="spa-label !text-[10px]">Målvärde</div>
              <div className="spa-value text-[32px] mt-0.5 text-accent" style={{ fontWeight: 300, letterSpacing: '-0.03em' }}>
                {fmt(target, 1)}
              </div>
            </div>
          </div>
          <input
            type="range"
            min={action.includes('ph') ? 6.5 : 50}
            max={action.includes('ph') ? 8.5 : 200}
            step={action.includes('ph') ? 0.1 : 1}
            value={current}
            onChange={(e) => setCurrent(parseFloat(e.target.value))}
            className="w-full"
          />
          <input
            type="range"
            min={action.includes('ph') ? 6.5 : 50}
            max={action.includes('ph') ? 8.5 : 200}
            step={action.includes('ph') ? 0.1 : 1}
            value={target}
            onChange={(e) => setTarget(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      {/* Result */}
      <div
        className="rounded-[20px] px-5 py-5 text-center text-white"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, var(--color-water) 0%, var(--color-accent) 60%, oklch(0.35 0.06 235) 100%)',
          boxShadow: 'inset 0 0 0 1px var(--color-cream-border)',
        }}
      >
        <div className="font-body text-[11px] uppercase opacity-75 mb-1" style={{ letterSpacing: '0.15em' }}>
          Dosering{selectedTubId ? ` för ${tubs.find((t) => t.id === selectedTubId)?.name}` : ''} · {volume}L
        </div>
        <div className="spa-value text-[80px] leading-none" style={{ fontWeight: 300, letterSpacing: '-0.04em' }}>
          {dose}
          <span className="text-[28px] opacity-70 ml-1">{activeFormula.unit}</span>
        </div>
        {exceeds && (
          <div className="mt-3 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <div className="font-body text-[12px] font-medium">Max {maxDose} {activeFormula.unit} per tillfälle</div>
            <div className="font-body text-[11px] opacity-80 mt-0.5">Dosera i omgångar, vänta 2h mellan</div>
          </div>
        )}
        <div className="font-display text-[14px] italic opacity-85 mt-3 leading-relaxed" style={{ fontWeight: 300 }}>
          Tillsätt långsamt, lös i hink vatten först.<br />Vänta 2h och testa igen.
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-[10px] text-charcoal-muted text-center px-4 font-body">
        Beräkningarna är ungefärliga riktlinjer. Följ alltid produktens datablad.
      </div>
    </div>
  )
}
