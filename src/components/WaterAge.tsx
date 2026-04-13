import { useState, useEffect } from 'react'
import { Droplets } from 'lucide-react'
import { api } from '../lib/api'
import { WATER_CHANGE_CYCLE_DAYS } from '../constants'

export function WaterAge() {
  const [lastChange, setLastChange] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getLatestWaterChange()
      .then((data) => setLastChange(data?.changed_at?.split('T')[0] ?? null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function markWaterChange() {
    const result = await api.markWaterChange()
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
        className="flex flex-col items-center justify-center bg-glass-surface border border-glass-border rounded-2xl p-3 transition-all duration-200 active:scale-[0.98] w-full"
      >
        <Droplets size={18} className="text-gold mb-1" />
        <div className="text-[11px] text-gold font-semibold">Markera vattenbyte</div>
        <div className="text-[10px] text-slate-500 mt-0.5">Starta spårning</div>
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
      className="flex flex-col items-center justify-center bg-glass-surface border border-glass-border rounded-2xl p-3 transition-all duration-200 active:scale-[0.98] w-full"
    >
      <div className="text-[10px] text-slate-500 mb-0.5">Vattenålder</div>
      <div className={`text-lg font-bold ${urgent ? 'text-status-warn' : 'text-gold'}`}>
        {daysSince} dagar
      </div>
      <div className="text-[10px] text-slate-500 mt-0.5">
        {daysLeft > 0 ? `Byte om ~${daysLeft}d` : 'Dags att byta!'}
      </div>
    </button>
  )
}
