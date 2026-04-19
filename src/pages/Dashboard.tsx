import { useState, useEffect } from 'react'
import { WaterSurface } from '../components/WaterSurface'
import { WaterStatusDetails } from '../components/WaterStatusDetails'
import { useWaterLog } from '../hooks/useWaterLog'
import { useSchedule } from '../hooks/useSchedule'
import { OPTIMAL_RANGES, getValueStatus, SCHEDULE_TASKS, DEFAULT_SETTINGS } from '../constants'
import { api } from '../lib/api'

interface Tub {
  id: string
  name: string
  volume: number
  target_temp: number | null
  sanitizer: string
  created_at: string
}

function fmt(v: number | undefined, decimals = 1): string {
  if (v == null) return '—'
  return v.toFixed(decimals).replace('.', ',')
}

export default function Dashboard() {
  const { entries } = useWaterLog()
  const { state: scheduleState, toggleTask } = useSchedule()
  const [tubs, setTubs] = useState<Tub[]>([])
  const [selectedTubId, setSelectedTubId] = useState<string>(() =>
    localStorage.getItem('aquacare_selected_tub') ?? ''
  )
  const [showStatusDetails, setShowStatusDetails] = useState(false)

  function selectTub(id: string) {
    setSelectedTubId(id)
    if (id) localStorage.setItem('aquacare_selected_tub', id)
    else localStorage.removeItem('aquacare_selected_tub')
  }

  useEffect(() => {
    api.listTubs().then((loaded) => {
      setTubs(loaded)
      if (loaded.length === 1) selectTub(loaded[0].id)
      const saved = localStorage.getItem('aquacare_selected_tub')
      if (saved && !loaded.find((t) => t.id === saved)) selectTub('')
    }).catch(() => {})
  }, [])

  const filtered = selectedTubId ? entries.filter((e) => e.tubId === selectedTubId) : entries
  const latest = filtered[0]
  const prev = filtered[1]
  const dailyTasks = SCHEDULE_TASKS.daily
  const doneCount = dailyTasks.filter((t) => scheduleState.daily[t.id]).length

  const overallStatus = (() => {
    if (!latest) return 'ok' as const
    const statuses = OPTIMAL_RANGES.slice(0, 3).map((r) => {
      const val = latest[r.key] as number | undefined
      return val !== undefined ? getValueStatus(r, val) : 'ok'
    })
    if (statuses.includes('error')) return 'alarm' as const
    if (statuses.includes('warn')) return 'warn' as const
    return 'ok' as const
  })()

  const today = new Date()
  const dayName = today.toLocaleDateString('sv-SE', { weekday: 'long' })
  const dateStr = `${today.getDate()} ${today.toLocaleDateString('sv-SE', { month: 'long' })}`

  return (
    <div className="px-4 pb-4 space-y-2">
      {/* Compact header — date + greeting on one line */}
      <div className="px-0.5 pt-1 pb-1">
        <div className="spa-label">{dayName} · {dateStr}</div>
        <h1 className="spa-heading text-[26px] mt-1 text-charcoal leading-snug">
          God morgon. <span className="text-charcoal-muted italic">Vattnet är stilla.</span>
        </h1>
      </div>

      {/* Tub selector pills */}
      {tubs.length >= 2 && (
        <div className="flex gap-1.5">
          {tubs.map((tub) => (
            <button
              key={tub.id}
              onClick={() => selectTub(tub.id)}
              className={selectedTubId === tub.id ? 'spa-pill spa-pill-active' : 'spa-pill spa-pill-inactive'}
            >
              {tub.name} · {tub.volume}L
            </button>
          ))}
        </div>
      )}

      {/* Water surface — compact */}
      <WaterSurface
        temp={latest?.waterTemp}
        status={overallStatus}
        onStatusClick={latest ? () => setShowStatusDetails(true) : undefined}
      />

      {showStatusDetails && (
        <WaterStatusDetails
          latest={latest}
          waterVolume={tubs.find((t) => t.id === selectedTubId)?.volume ?? DEFAULT_SETTINGS.waterVolume}
          onClose={() => setShowStatusDetails(false)}
        />
      )}

      {/* Value tiles — 2×2 compact */}
      {latest && (
        <div className="grid grid-cols-2 gap-2">
          {OPTIMAL_RANGES.slice(0, 3).map((range) => {
            const val = latest[range.key] as number | undefined
            if (val === undefined) return null
            const prevVal = prev?.[range.key] as number | undefined
            const status = getValueStatus(range, val)
            const statusColor = status === 'ok' ? 'var(--color-status-ok)' : status === 'warn' ? 'var(--color-status-warn)' : 'var(--color-status-error)'
            const statusLabel = status === 'ok' ? 'optimalt' : status === 'warn' ? 'nära gräns' : 'kritiskt'
            const delta = prevVal != null ? val - prevVal : null
            const decimals = range.key === 'totalAlkalinity' ? 0 : 1

            return (
              <div key={range.key} className="spa-card p-2.5 flex flex-col gap-0">
                <div className="spa-label !text-[9px]">{range.label}</div>
                <div className="spa-value text-[28px] leading-none text-charcoal mt-0.5">
                  {fmt(val, decimals)}
                  <span className="text-[10px] text-charcoal-whisper ml-0.5 font-body">{range.unit}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
                  <span className="font-body text-[10px] text-charcoal-muted">
                    {statusLabel}
                    {delta != null && delta !== 0 && (
                      <span className="spa-mono ml-1 text-charcoal-whisper">
                        {delta > 0 ? '↑' : '↓'}{fmt(Math.abs(delta), decimals)}
                      </span>
                    )}
                  </span>
                </div>
                {/* Mini range bar */}
                {range.min != null && range.max != null && (
                  <div className="mt-1.5 h-[3px] rounded-full relative" style={{ background: 'var(--color-cream-border)' }}>
                    <div
                      className="absolute top-0 bottom-0 rounded-full"
                      style={{
                        background: 'var(--color-accent-soft)',
                        left: `${Math.max(0, Math.min(100, ((range.min - range.min * 0.85) / (range.max * 1.15 - range.min * 0.85)) * 100))}%`,
                        right: `${Math.max(0, Math.min(100, 100 - ((range.max - range.min * 0.85) / (range.max * 1.15 - range.min * 0.85)) * 100))}%`,
                      }}
                    />
                    <div
                      className="absolute rounded-full"
                      style={{
                        background: statusColor,
                        width: 6, top: -2, bottom: -2,
                        left: `calc(${Math.max(0, Math.min(100, ((val - range.min * 0.85) / (range.max * 1.15 - range.min * 0.85)) * 100))}% - 3px)`,
                        boxShadow: '0 0 0 2px var(--color-cream-light)',
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })}

          {/* Temp tile */}
          {latest.waterTemp !== undefined && (
            <div className="spa-card p-2.5 flex flex-col gap-0">
              <div className="spa-label !text-[9px]">Temp</div>
              <div className="spa-value text-[28px] leading-none text-charcoal mt-0.5">
                {fmt(latest.waterTemp, 1)}
                <span className="text-[10px] text-charcoal-whisper ml-0.5 font-body">°C</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-status-ok" />
                <span className="font-body text-[10px] text-charcoal-muted">stabil</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dagens underhåll — compact section header */}
      <div className="flex items-center gap-2 mt-2 mb-0.5 px-0.5">
        <h2 className="spa-heading text-[17px] text-charcoal" style={{ fontWeight: 400 }}>
          Dagens underhåll
        </h2>
        <div className="flex-1 h-px bg-cream-border" />
        <span className="spa-mono text-charcoal-whisper">{doneCount}/{dailyTasks.length}</span>
      </div>

      {/* Ritual list — compact rows */}
      <div className="spa-card overflow-hidden !p-0">
        {dailyTasks.map((task) => {
          const done = scheduleState.daily[task.id] ?? false
          return (
            <button
              key={task.id}
              onClick={() => toggleTask('daily', task.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left border-b border-cream-border last:border-b-0 transition-opacity active:opacity-80"
            >
              <div
                className="w-[18px] h-[18px] rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-200"
                style={{
                  border: `1.5px solid ${done ? 'var(--color-status-ok)' : 'var(--color-charcoal-line)'}`,
                  background: done ? 'var(--color-status-ok)' : 'transparent',
                }}
              >
                {done && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="font-display text-[14px] leading-tight"
                  style={{
                    color: done ? 'var(--color-charcoal-whisper)' : 'var(--color-charcoal)',
                    textDecoration: done ? 'line-through' : 'none',
                  }}
                >
                  {task.name}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
