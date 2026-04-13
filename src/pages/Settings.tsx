import { useState } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { GlassCard } from '../components/GlassCard'
import { useSettings } from '../hooks/useSettings'
import { formatSwedishDecimal } from '../constants'

export default function Settings() {
  const navigate = useNavigate()
  const { settings, updateSettings } = useSettings()
  const [spaName, setSpaName] = useState(settings.spaName)
  const [volume, setVolume] = useState(String(settings.waterVolume))
  const [cycleDays, setCycleDays] = useState(String(settings.waterChangeCycleDays))
  const [saved, setSaved] = useState(false)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const vol = Number(volume)
    const days = Number(cycleDays)
    if (!spaName.trim() || isNaN(vol) || vol <= 0 || isNaN(days) || days <= 0) return
    updateSettings({
      spaName: spaName.trim(),
      waterVolume: vol,
      waterChangeCycleDays: days,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
        <h1 className="font-display text-xl text-gold font-bold">Inställningar</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        <GlassCard>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Spa-namn</label>
              <input
                type="text"
                value={spaName}
                onChange={(e) => setSpaName(e.target.value)}
                placeholder="MSpa Bristol Urban"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-colors duration-200"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Vattenvolym (liter)</label>
              <input
                type="text"
                inputMode="numeric"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                placeholder="1000"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-colors duration-200"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Används för kemikalieberäkningar
              </span>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Vattenbytescykel (dagar)</label>
              <input
                type="text"
                inputMode="numeric"
                value={cycleDays}
                onChange={(e) => setCycleDays(e.target.value)}
                placeholder="90"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-colors duration-200"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Nuvarande cykel: {formatSwedishDecimal(settings.waterChangeCycleDays)} dagar
              </span>
            </div>
          </div>
        </GlassCard>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 w-full min-h-[48px] bg-gradient-to-br from-gold to-gold-dark text-navy rounded-[14px] font-bold text-[15px] tracking-wide shadow-[0_4px_16px_rgba(232,201,122,0.2)] transition-transform duration-200 active:scale-[0.98]"
        >
          <Save size={18} strokeWidth={2.5} />
          {saved ? 'Sparat!' : 'Spara inställningar'}
        </button>
      </form>
    </div>
  )
}
