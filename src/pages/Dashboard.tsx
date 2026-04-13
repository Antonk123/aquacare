import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Plus, Check, Settings } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { SmartStatus } from '../components/SmartStatus'
import { TrendChart } from '../components/TrendChart'
import { WaterAge } from '../components/WaterAge'
import { useWaterLog } from '../hooks/useWaterLog'
import { useSchedule } from '../hooks/useSchedule'
import { OPTIMAL_RANGES, getValueStatus, formatSwedishDecimal, SCHEDULE_TASKS } from '../constants'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

interface Tub {
  id: string
  name: string
  volume: number
  target_temp: number | null
  sanitizer: string
  created_at: string
}

function getTubStatusDot(lastLogDate: string | undefined): string {
  if (!lastLogDate) return 'bg-status-error'
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const logDate = lastLogDate.split('T')[0]
  if (logDate === today) return 'bg-status-ok'
  if (logDate === yesterday) return 'bg-status-warn'
  return 'bg-status-error'
}

function formatLastLog(lastLogDate: string | undefined): string {
  if (!lastLogDate) return 'Aldrig loggad'
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const logDate = lastLogDate.split('T')[0]
  const time = new Date(lastLogDate).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
  if (logDate === today) return `Idag, ${time}`
  if (logDate === yesterday) return `Igår, ${time}`
  return new Date(lastLogDate).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
}

export default function Dashboard() {
  const { entries, streak } = useWaterLog()
  const { state: scheduleState, toggleTask } = useSchedule()
  const { facility } = useAuth()
  const [tubs, setTubs] = useState<Tub[]>([])
  const [selectedTubId, setSelectedTubId] = useState<string>('')

  useEffect(() => {
    api.listTubs().then(setTubs).catch(() => {})
  }, [])

  const filtered = selectedTubId ? entries.filter((e) => e.tubId === selectedTubId) : entries
  const latest = filtered[0]
  const dailyTasks = SCHEDULE_TASKS.daily
  const doneCount = dailyTasks.filter((t) => scheduleState.daily[t.id]).length

  // Tub status overview: last log per tub
  const lastLogByTub = tubs.map((tub) => {
    const lastEntry = entries.find((e) => e.tubId === tub.id)
    return { tub, lastLogDate: lastEntry?.date }
  })

  return (
    <div className="p-5 space-y-3 relative">
      {/* Aurora glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[120px] bg-[radial-gradient(ellipse,rgba(232,201,122,0.1)_0%,transparent_70%)] pointer-events-none" />

      {/* Header with temp pill */}
      <div className="text-center mb-1 relative">
        <Link
          to="/installningar"
          className="absolute right-0 top-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Inställningar"
        >
          <Settings size={18} className="text-slate-400" />
        </Link>
        <h1 className="font-display text-2xl text-gold tracking-[3px] font-bold">AquaCare</h1>
        <div className="inline-flex items-center gap-1.5 bg-gold/10 border border-gold/20 rounded-full px-3 py-1 mt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-gold" />
          <span className="text-[11px] text-gold font-medium">
            {latest?.waterTemp ? `${formatSwedishDecimal(latest.waterTemp)}°C · ` : ''}
            {selectedTubId ? (tubs.find((t) => t.id === selectedTubId)?.name ?? facility?.name) : (facility?.name ?? 'AquaCare')}
          </span>
        </div>
      </div>

      {/* Tub filter pills */}
      {tubs.length > 0 && (
        <div
          className="flex gap-2 overflow-x-auto pb-0.5"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as any}
        >
          <button
            onClick={() => setSelectedTubId('')}
            className={`px-3 py-1.5 rounded-lg text-[12px] whitespace-nowrap transition-colors duration-150 ${
              selectedTubId === ''
                ? 'bg-gold/90 text-navy font-semibold'
                : 'bg-white/5 text-slate-400'
            }`}
          >
            Alla
          </button>
          {tubs.map((tub) => (
            <button
              key={tub.id}
              onClick={() => setSelectedTubId(tub.id)}
              className={`px-3 py-1.5 rounded-lg text-[12px] whitespace-nowrap transition-colors duration-150 ${
                selectedTubId === tub.id
                  ? 'bg-gold/90 text-navy font-semibold'
                  : 'bg-white/5 text-slate-400'
              }`}
            >
              {tub.name}
            </button>
          ))}
        </div>
      )}

      {/* Tub status overview — only when "Alla" selected and 2+ tubs */}
      {tubs.length >= 2 && selectedTubId === '' && (
        <GlassCard>
          <div className="text-[10px] text-gold uppercase tracking-[1.5px] font-semibold mb-2">Badkarstatus</div>
          <div className="space-y-2">
            {lastLogByTub.map(({ tub, lastLogDate }) => (
              <div key={tub.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getTubStatusDot(lastLogDate)}`} />
                  <span className="text-[12px] text-slate-200 font-medium">{tub.name}</span>
                </div>
                <span className="text-[11px] text-slate-500">{formatLastLog(lastLogDate)}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Hero Status */}
      <SmartStatus latest={latest} />

      {/* Bento grid — values */}
      {latest && (
        <div className="grid grid-cols-2 gap-2">
          {OPTIMAL_RANGES.slice(0, 3).map((range, i) => {
            const val = filtered[0]?.[range.key] as number | undefined
            if (val === undefined) return null
            const status = getValueStatus(range, val)
            const statusColor = status === 'ok' ? 'text-status-ok' : status === 'warn' ? 'text-status-warn' : 'text-status-error'
            const glowColor = status === 'ok' ? 'rgba(74,222,128,0.1)' : status === 'warn' ? 'rgba(251,191,36,0.1)' : 'rgba(248,113,113,0.1)'
            const statusLabel = status === 'ok' ? 'Optimalt' : status === 'warn' ? 'Varning' : 'Kritiskt'
            const isWide = i === 2 // alkalinity spans if odd

            return (
              <GlassCard
                key={range.key}
                className={`relative overflow-hidden ${isWide && OPTIMAL_RANGES.slice(0, 3).filter((r) => latest[r.key] !== undefined).length === 3 ? '' : ''}`}
              >
                <div
                  className="absolute -top-2.5 -right-2.5 w-12 h-12 rounded-full pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` }}
                />
                <div className="text-[10px] text-slate-500 uppercase tracking-[1.5px]">{range.label}</div>
                <div className={`text-[28px] font-extrabold ${statusColor} leading-tight mt-0.5`}>
                  {formatSwedishDecimal(val)}
                </div>
                <div className={`text-[9px] ${statusColor} font-medium mt-0.5`}>
                  {status === 'ok' ? '●' : '▲'} {statusLabel}
                </div>
              </GlassCard>
            )
          })}

          {/* Water age in bento */}
          <WaterAge />
        </div>
      )}

      {/* pH Trend */}
      <TrendChart entries={filtered} />

      {/* Streak + Tasks */}
      <div className="flex gap-2">
        {/* Streak — compact */}
        <GlassCard className="w-[80px] flex-shrink-0 flex flex-col items-center justify-center">
          <Flame size={16} className="text-gold mb-0.5" />
          <div className="text-[22px] font-extrabold text-gold leading-tight">{streak.currentStreak}</div>
          <div className="text-[9px] text-slate-500 mt-0.5">dagar i rad</div>
          <div className="text-[8px] text-slate-600 mt-0.5">Bäst: {streak.bestStreak ?? streak.currentStreak}</div>
        </GlassCard>

        {/* Tasks — fills remaining */}
        <GlassCard className="flex-1">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] text-gold font-semibold uppercase tracking-[1.5px]">Idag</span>
            <span className="text-[10px] text-slate-500">{doneCount}/{dailyTasks.length}</span>
          </div>
          <div className="space-y-1.5">
            {dailyTasks.map((task) => {
              const done = scheduleState.daily[task.id] ?? false
              return (
                <button
                  key={task.id}
                  onClick={() => toggleTask('daily', task.id)}
                  className="w-full flex items-center gap-2 text-left transition-colors duration-200 active:scale-[0.98]"
                >
                  <div
                    className={`w-[16px] h-[16px] rounded flex-shrink-0 flex items-center justify-center transition-colors duration-200 ${
                      done ? 'bg-status-ok' : 'border-[1.5px] border-gold/25'
                    }`}
                  >
                    {done && <Check size={10} className="text-navy" strokeWidth={3} />}
                  </div>
                  <span className={`text-[12px] ${done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                    {task.name}
                  </span>
                </button>
              )
            })}
          </div>
        </GlassCard>
      </div>

      {/* CTA with glow */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-br from-gold/25 to-gold/10 rounded-[18px] blur-lg" />
        <Link
          to="/logg/ny"
          className="relative flex items-center justify-center gap-2 w-full min-h-[48px] bg-gradient-to-br from-gold to-gold-dark text-navy rounded-[14px] font-bold text-[15px] tracking-wide transition-transform duration-200 active:scale-[0.98]"
        >
          <Plus size={18} strokeWidth={2.5} />
          Logga vattentest
        </Link>
      </div>
    </div>
  )
}
