import { useState, useEffect } from 'react'
import { Droplets } from 'lucide-react'
import { api } from '../lib/api'
import { WATER_CHANGE_CYCLE_DAYS } from '../constants'

export function WaterAge({ tubId }: { tubId?: string }) {
  const [lastChange, setLastChange] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getLatestWaterChange(tubId)
      .then((data) => setLastChange(data?.changed_at?.split('T')[0] ?? null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tubId])

  async function markWaterChange() {
    const result = await api.markWaterChange(tubId)
    setLastChange(result.changed_at.split('T')[0])
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center bg-glass-surface border border-glass-border rounded-2xl p-3 w-full">
        <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!lastChange) {
    return (
      <button
        onClick={markWaterChange}
        className="flex flex-col items-center justify-center bg-cream border border-cream-border rounded-xl p-3 transition-all duration-200 active:opacity-80 w-full"
      >
        <Droplets size={18} className="text-charcoal mb-1" strokeWidth={1.75} />
        <div className="text-[11px] text-charcoal font-semibold tracking-tight">
          Markera vattenbyte
        </div>
        <div className="text-[10px] text-charcoal-muted mt-0.5">Starta spårning</div>
      </button>
    )
  }

  const daysSince = Math.floor(
    (Date.now() - new Date(lastChange).getTime()) / (1000 * 60 * 60 * 24)
  )
  const daysLeft = Math.max(0, WATER_CHANGE_CYCLE_DAYS - daysSince)
  const urgent = daysLeft <= 7

  return (
    <button
      onClick={markWaterChange}
      className="flex flex-col items-center justify-center bg-cream border border-cream-border rounded-xl p-3 transition-all duration-200 active:opacity-80 w-full"
    >
      <div className="text-[10px] text-charcoal-muted mb-0.5 uppercase tracking-[1.5px]">
        Vattenålder
      </div>
      <div
        className={`text-lg font-semibold tracking-tight tabular-nums ${
          urgent ? 'text-status-warn' : 'text-charcoal'
        }`}
      >
        {daysSince} dagar
      </div>
      <div className="text-[10px] text-charcoal-muted mt-0.5">
        {daysLeft > 0 ? `Byte om ~${daysLeft}d` : 'Dags att byta!'}
      </div>
    </button>
  )
}
