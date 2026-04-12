import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Pipette, Check } from 'lucide-react'
import { useWaterLog } from '../hooks/useWaterLog'
import { StripReader } from '../components/StripReader'
import { GlassCard } from '../components/GlassCard'

interface FormField {
  key: string
  label: string
  placeholder: string
}

const FIELDS: FormField[] = [
  { key: 'ph', label: 'pH', placeholder: '7,4' },
  { key: 'freeChlorine', label: 'Fritt klor (mg/L)', placeholder: '4,0' },
  { key: 'bromine', label: 'Brom (mg/L)', placeholder: '5,0' },
  { key: 'totalAlkalinity', label: 'Alkalinitet (mg/L)', placeholder: '100' },
  { key: 'calciumHardness', label: 'Kalciumhårdhet (mg/L)', placeholder: '200' },
  { key: 'tds', label: 'TDS (mg/L)', placeholder: '800' },
  { key: 'waterTemp', label: 'Vattentemp (°C)', placeholder: '38' },
]

const STRIP_KEYS = ['ph', 'freeChlorine', 'totalAlkalinity']
const STRIP_LABELS: Record<string, string> = {
  ph: 'pH',
  freeChlorine: 'Fritt klor',
  totalAlkalinity: 'Alkalinitet',
}

export default function WaterLogForm() {
  const navigate = useNavigate()
  const { addEntry } = useWaterLog()
  const [values, setValues] = useState<Record<string, string>>({})
  const [note, setNote] = useState('')
  const [showStrip, setShowStrip] = useState(false)
  const [stripDone, setStripDone] = useState(false)

  const hasStripValues = STRIP_KEYS.some((k) => values[k])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const entry: Record<string, unknown> = {
      date: new Date().toISOString(),
    }
    if (note.trim()) {
      entry.note = note.trim()
    }
    for (const field of FIELDS) {
      const raw = values[field.key]?.replace(',', '.')
      if (raw && !isNaN(Number(raw))) {
        entry[field.key] = Number(raw)
      }
    }
    addEntry(entry as Parameters<typeof addEntry>[0])
    navigate('/logg')
  }

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Tillbaka"
        >
          <ArrowLeft size={20} className="text-slate-400" />
        </button>
        <h1 className="font-display text-xl text-gold font-bold">Ny loggning</h1>
      </div>

      {showStrip ? (
        <StripReader
          onComplete={(vals) => {
            setValues((prev) => ({
              ...prev,
              freeChlorine: String(vals.freeChlorine).replace('.', ','),
              ph: String(vals.ph).replace('.', ','),
              totalAlkalinity: String(vals.totalAlkalinity),
            }))
            setShowStrip(false)
            setStripDone(true)
          }}
          onCancel={() => setShowStrip(false)}
        />
      ) : (
        <>
          {/* Strip reader button or summary */}
          {stripDone && hasStripValues ? (
            <GlassCard className="!bg-status-ok/6 !border-status-ok/15">
              <div className="flex items-center gap-2 mb-2">
                <Check size={14} className="text-status-ok" strokeWidth={3} />
                <span className="text-xs text-status-ok font-semibold uppercase tracking-wider">Avläsning klar</span>
              </div>
              <div className="flex gap-3">
                {STRIP_KEYS.map((key) => {
                  const val = values[key]
                  if (!val) return null
                  return (
                    <div key={key} className="text-center">
                      <div className="text-lg font-bold text-slate-200">{val}</div>
                      <div className="text-[10px] text-slate-400">{STRIP_LABELS[key]}</div>
                    </div>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={() => setShowStrip(true)}
                className="text-[11px] text-gold mt-2 font-medium"
              >
                Gör om avläsning
              </button>
            </GlassCard>
          ) : (
            <button
              type="button"
              onClick={() => setShowStrip(true)}
              className="flex items-center justify-center gap-2 w-full min-h-[48px] bg-gold/10 border border-gold/20 text-gold rounded-xl font-semibold text-[13px] transition-all duration-200 active:scale-[0.98]"
            >
              <Pipette size={16} strokeWidth={2.5} />
              Avläs teststicka
            </button>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Note field */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                Anteckning <span className="text-slate-500">(valfritt)</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="T.ex. Chockbehandling, säsongsstart"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-colors duration-200"
              />
            </div>

            {/* Extra fields — collapsed if strip was used */}
            {stripDone && hasStripValues && (
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-medium pt-1">
                Övriga värden (valfritt)
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {FIELDS.filter((f) => !(stripDone && hasStripValues && STRIP_KEYS.includes(f.key))).map((field) => (
                <div key={field.key} className={field.key === 'waterTemp' ? 'col-span-2' : ''}>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">{field.label}</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder={field.placeholder}
                    value={values[field.key] ?? ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-colors duration-200"
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 w-full min-h-[48px] bg-gradient-to-br from-gold to-gold-dark text-navy rounded-[14px] font-bold text-[15px] tracking-wide shadow-[0_4px_16px_rgba(232,201,122,0.2)] transition-transform duration-200 active:scale-[0.98] mt-4"
            >
              <Save size={18} strokeWidth={2.5} />
              Spara loggning
            </button>
          </form>
        </>
      )}
    </div>
  )
}
