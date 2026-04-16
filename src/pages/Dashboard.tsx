import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Plus, Check } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { SmartStatus } from '../components/SmartStatus'
import { TrendChart } from '../components/TrendChart'
import { WaterAge } from '../components/WaterAge'
import { ThemeToggle } from '../components/ThemeToggle'
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
    <div className="p-5 space-y-4">
      {/* Editorial header */}
      <div className="relative text-center pt-2 pb-1">
        <ThemeToggle className="absolute right-0 top-0" />
        <h1 className="font-display text-[32px] leading-none font-semibold text-charcoal tracking-[-0.04em]">
          AquaCare
        </h1>
        <div className="inline-flex items-center gap-1.5 bg-cream border border-cream-border rounded-full px-3 py-1 mt-3">
          <div className="w-1.5 h-1.5 rounded-full bg-charcoal" />
          <span className="text-[11px] text-charcoal font-medium tabular-nums">
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
                ? 'bg-charcoal text-cream-light font-semibold'
                : 'bg-charcoal-whisper text-charcoal-muted'
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
                  ? 'bg-charcoal text-cream-light font-semibold'
                  : 'bg-charcoal-whisper text-charcoal-muted'
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
          <div className="text-[10px] text-charcoal-muted uppercase tracking-[1.5px] font-medium mb-2">Badkarstatus</div>
          <div className="space-y-2">
            {lastLogByTub.map(({ tub, lastLogDate }) => (
              <div key={tub.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getTubStatusDot(lastLogDate)}`} />
                  <span className="text-[12px] text-charcoal font-medium">{tub.name}</span>
                </div>
                <span className="text-[11px] text-charcoal-muted">{formatLastLog(lastLogDate)}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Hero Status */}
      <SmartStatus latest={latest} />

      {/* Values grid */}
      {latest && (
        <div className="grid grid-cols-2 gap-2">
          {OPTIMAL_RANGES.slice(0, 3).map((range) => {
            const val = filtered[0]?.[range.key] as number | undefined
            if (val === undefined) return null
            const status = getValueStatus(range, val)
            const statusColor =
              status === 'ok'
                ? 'text-charcoal'
                : status === 'warn'
                  ? 'text-status-warn'
                  : 'text-status-error'
            const statusLabel =
              status === 'ok' ? 'Optimalt' : status === 'warn' ? 'Varning' : 'Kritiskt'

            return (
              <GlassCard key={range.key} className="relative overflow-hidden">
                <div className="text-[10px] text-charcoal-muted uppercase tracking-[1.5px] font-medium">
                  {range.label}
                </div>
                <div
                  className={`text-[30px] font-semibold ${statusColor} leading-tight mt-1 tracking-[-0.03em] tabular-nums`}
                >
                  {formatSwedishDecimal(val)}
                </div>
                <div
                  className={`text-[10px] font-medium mt-0.5 tracking-tight ${
                    status === 'ok' ? 'text-status-ok' : statusColor
                  }`}
                >
                  {status === 'ok' ? '●' : '▲'} {statusLabel}
                </div>
              </GlassCard>
            )
          })}

          {/* Water age in bento */}
          <WaterAge tubId={selectedTubId || undefined} />
        </div>
      )}

      {/* pH Trend */}
      <TrendChart entries={filtered} />

      {/* Streak + Tasks */}
      <div className="flex gap-2">
        {/* Streak — compact */}
        <GlassCard className="w-[84px] flex-shrink-0 flex flex-col items-center justify-center">
          <Flame size={16} className="text-charcoal mb-0.5" strokeWidth={1.75} />
          <div className="text-[24px] font-semibold text-charcoal leading-tight tracking-[-0.03em] tabular-nums">
            {streak.currentStreak}
          </div>
          <div className="text-[10px] text-charcoal-muted mt-0.5">dagar i rad</div>
          <div className="text-[9px] text-charcoal-muted/70 mt-0.5">
            Bäst: {streak.bestStreak ?? streak.currentStreak}
          </div>
        </GlassCard>

        {/* Tasks — fills remaining */}
        <GlassCard className="flex-1">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[10px] text-charcoal-muted font-medium uppercase tracking-[1.5px]">
              Idag
            </span>
            <span className="text-[10px] text-charcoal-muted tabular-nums">
              {doneCount}/{dailyTasks.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {dailyTasks.map((task) => {
              const done = scheduleState.daily[task.id] ?? false
              return (
                <button
                  key={task.id}
                  onClick={() => toggleTask('daily', task.id)}
                  className="w-full flex items-center gap-2 text-left transition-opacity duration-200 active:opacity-80"
                >
                  <div
                    className={`w-[16px] h-[16px] rounded flex-shrink-0 flex items-center justify-center transition-colors duration-200 ${
                      done
                        ? 'bg-status-ok border border-status-ok'
                        : 'border-[1.5px] border-charcoal-line'
                    }`}
                  >
                    {done && <Check size={10} className="text-cream-light" strokeWidth={3} />}
                  </div>
                  <span
                    className={`text-[13px] ${
                      done ? 'text-charcoal-muted line-through' : 'text-charcoal'
                    }`}
                  >
                    {task.name}
                  </span>
                </button>
              )
            })}
          </div>
        </GlassCard>
      </div>

      {/* Primary CTA — Lovable inset shadow dark button */}
      <Link
        to="/logg/ny"
        className="flex items-center justify-center gap-2 w-full min-h-[48px] bg-charcoal text-cream-light rounded-md font-medium text-[15px] tracking-tight transition-opacity duration-200 active:opacity-80 shadow-inset-btn"
      >
        <Plus size={18} strokeWidth={2} />
        Logga vattentest
      </Link>
    </div>
  )
}
