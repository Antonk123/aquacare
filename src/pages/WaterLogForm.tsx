import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { useWaterLog } from '../hooks/useWaterLog'

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

export default function WaterLogForm() {
  const navigate = useNavigate()
  const { addEntry } = useWaterLog()
  const [values, setValues] = useState<Record<string, string>>({})

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const entry: Record<string, unknown> = {
      date: new Date().toISOString(),
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

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map((field) => (
            <div key={field.key} className={field.key === 'waterTemp' ? 'col-span-2' : ''}>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">{field.label}</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder={field.placeholder}
                value={values[field.key] ?? ''}
                onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-gold/40 transition-colors duration-200"
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
    </div>
  )
}
