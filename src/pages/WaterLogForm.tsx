import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Pipette, Check } from 'lucide-react'
import { useWaterLog } from '../hooks/useWaterLog'
import { StripReader } from '../components/StripReader'
import { GlassCard } from '../components/GlassCard'
import { VALIDATION_RANGES } from '../constants'
import { api } from '../lib/api'

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

const INPUT_CLS =
  'w-full bg-cream-light border border-cream-border rounded-md px-3.5 min-h-[48px] text-base text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:shadow-focus-warm transition-shadow duration-200'

const LABEL_CLS = 'block text-[12px] text-charcoal-muted mb-1.5 font-medium tracking-tight'

export default function WaterLogForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { entries, addEntry, updateEntry } = useWaterLog()
  const [values, setValues] = useState<Record<string, string>>({})
  const [note, setNote] = useState('')
  const [showStrip, setShowStrip] = useState(false)
  const [stripDone, setStripDone] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [tubs, setTubs] = useState<{ id: string; name: string; volume: number; sanitizer: string }[]>([])
  const [selectedTubId, setSelectedTubId] = useState<string>('')

  const isEditing = !!id
  const editEntry = isEditing ? entries.find((e) => e.id === id) : undefined

  // Load tubs on mount
  useEffect(() => {
    api.listTubs().then(setTubs).catch(() => {})
  }, [])

  // Populate form when editing
  useEffect(() => {
    if (editEntry) {
      const vals: Record<string, string> = {}
      for (const field of FIELDS) {
        const val = editEntry[field.key as keyof typeof editEntry]
        if (val !== undefined) {
          vals[field.key] = String(val).replace('.', ',')
        }
      }
      setValues(vals)
      setNote(editEntry.note ?? '')
      setSelectedTubId(editEntry.tubId ?? '')
    }
  }, [editEntry])

  const hasStripValues = STRIP_KEYS.some((k) => values[k])

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    for (const field of FIELDS) {
      const raw = values[field.key]?.replace(',', '.')
      if (!raw) continue
      const num = Number(raw)
      if (isNaN(num)) {
        newErrors[field.key] = 'Ogiltigt tal'
        continue
      }
      const range = VALIDATION_RANGES[field.key]
      if (range && (num < range.min || num > range.max)) {
        newErrors[field.key] = `Måste vara ${range.min}–${range.max}`
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const entry: Record<string, unknown> = {}
    if (!isEditing) {
      entry.date = new Date().toISOString()
    }
    if (note.trim()) {
      entry.note = note.trim()
    } else {
      entry.note = undefined
    }
    if (selectedTubId) {
      entry.tubId = selectedTubId
    }
    for (const field of FIELDS) {
      const raw = values[field.key]?.replace(',', '.')
      if (raw && !isNaN(Number(raw))) {
        entry[field.key] = Number(raw)
      } else {
        entry[field.key] = undefined
      }
    }

    if (isEditing && id) {
      updateEntry(id, entry as Parameters<typeof updateEntry>[1])
    } else {
      entry.date = new Date().toISOString()
      addEntry(entry as Parameters<typeof addEntry>[0])
    }
    navigate('/logg')
  }

  if (isEditing && !editEntry) {
    return (
      <div className="p-5">
        <p className="text-sm text-charcoal-muted">Loggningen hittades inte.</p>
      </div>
    )
  }

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-charcoal-hover transition-colors"
          aria-label="Tillbaka"
        >
          <ArrowLeft size={20} className="text-charcoal" strokeWidth={1.75} />
        </button>
        <h1 className="font-display text-[24px] leading-none font-semibold text-charcoal tracking-[-0.03em]">
          {isEditing ? 'Redigera loggning' : 'Ny loggning'}
        </h1>
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
          {!isEditing && (stripDone && hasStripValues ? (
            <GlassCard className="bg-status-ok/5 border-status-ok/20">
              <div className="flex items-center gap-2 mb-2">
                <Check size={14} className="text-status-ok" strokeWidth={2.5} />
                <span className="text-[11px] text-status-ok font-medium uppercase tracking-[1.5px]">
                  Avläsning klar
                </span>
              </div>
              <div className="flex gap-4">
                {STRIP_KEYS.map((key) => {
                  const val = values[key]
                  if (!val) return null
                  return (
                    <div key={key} className="text-center">
                      <div className="text-lg font-semibold text-charcoal tabular-nums tracking-tight">
                        {val}
                      </div>
                      <div className="text-[10px] text-charcoal-muted">
                        {STRIP_LABELS[key]}
                      </div>
                    </div>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={() => setShowStrip(true)}
                className="text-[12px] text-charcoal mt-3 font-medium underline underline-offset-2"
              >
                Gör om avläsning
              </button>
            </GlassCard>
          ) : (
            <button
              type="button"
              onClick={() => setShowStrip(true)}
              className="flex items-center justify-center gap-2 w-full min-h-[48px] bg-cream border border-charcoal-line text-charcoal rounded-md font-medium text-[14px] tracking-tight transition-opacity duration-200 active:opacity-80"
            >
              <Pipette size={16} strokeWidth={1.75} />
              Avläs teststicka
            </button>
          ))}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Tub selector */}
            {tubs.length > 0 && (
              <div>
                <label className="block text-xs text-charcoal-muted mb-1.5 font-medium">
                  Bad <span className="text-charcoal-muted">(valfritt)</span>
                </label>
                <select
                  value={selectedTubId}
                  onChange={(e) => setSelectedTubId(e.target.value)}
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

            {/* Note field */}
            <div>
              <label className={LABEL_CLS}>
                Anteckning{' '}
                <span className="text-charcoal-muted/70 font-normal">(valfritt)</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="T.ex. Chockbehandling, säsongsstart"
                className={INPUT_CLS}
              />
            </div>

            {/* Extra fields — collapsed if strip was used */}
            {!isEditing && stripDone && hasStripValues && (
              <div className="text-[11px] text-charcoal-muted uppercase tracking-[1.5px] font-medium pt-1">
                Övriga värden (valfritt)
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {FIELDS.filter((f) => !(!isEditing && stripDone && hasStripValues && STRIP_KEYS.includes(f.key))).map((field) => {
                const range = VALIDATION_RANGES[field.key]
                const error = errors[field.key]
                return (
                  <div key={field.key} className={field.key === 'waterTemp' ? 'col-span-2' : ''}>
                    <label className={LABEL_CLS}>{field.label}</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder={field.placeholder}
                      value={values[field.key] ?? ''}
                      onChange={(e) => {
                        setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                        if (errors[field.key]) setErrors((prev) => { const n = { ...prev }; delete n[field.key]; return n })
                      }}
                      className={`${INPUT_CLS} ${error ? '!border-status-error/50 !shadow-none' : ''}`}
                    />
                    {error ? (
                      <span className="text-[11px] text-status-error mt-1 block">{error}</span>
                    ) : range ? (
                      <span className="text-[11px] text-charcoal-muted/70 mt-1 block">{range.min}–{range.max}</span>
                    ) : null}
                  </div>
                )
              })}
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 w-full min-h-[48px] bg-charcoal text-cream-light rounded-md font-medium text-[15px] tracking-tight shadow-inset-btn transition-opacity duration-200 active:opacity-80 mt-4"
            >
              <Save size={18} strokeWidth={2} />
              {isEditing ? 'Uppdatera loggning' : 'Spara loggning'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
