import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { WaterSurface } from '../components/WaterSurface'
import { useWaterLog } from '../hooks/useWaterLog'
import { useSchedule } from '../hooks/useSchedule'
import { OPTIMAL_RANGES, getValueStatus, SCHEDULE_TASKS } from '../constants'
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

  // Overall status for water surface
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
    <div className="px-4 pb-4 space-y-3">
      {/* Editorial header */}
      <div className="px-1 pt-2 pb-3">
        <div className="spa-label">{dayName} · {dateStr}</div>
        <h1 className="spa-heading text-[34px] mt-1.5 text-charcoal">
          God morgon.<br />
          <span className="text-charcoal-muted italic">vattnet är stilla idag.</span>
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

      {/* Water surface */}
      <WaterSurface temp={latest?.waterTemp} status={overallStatus} />

      {/* Value tiles — 2×2 */}
      {latest && (
        <div className="grid grid-cols-2 gap-2.5">
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
              <div key={range.key} className="spa-card p-3.5 flex flex-col gap-0.5">
                <div className="spa-label !text-[10px]">{range.label}</div>
                <div className="spa-value text-[34px] leading-tight text-charcoal">
                  {fmt(val, decimals)}
                  <span className="text-[12px] text-charcoal-whisper ml-1 font-body">{range.unit}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
                  <span className="font-body text-[11px] text-charcoal-muted" style={{ letterSpacing: '-0.01em' }}>
                    {statusLabel}
                    {delta != null && delta !== 0 && (
                      <span className="spa-mono ml-1.5 text-charcoal-whisper">
                        {delta > 0 ? '↑' : '↓'}{fmt(Math.abs(delta), decimals)}
                      </span>
                    )}
                  </span>
                </div>
                {/* Mini range bar */}
                {range.min != null && range.max != null && (
                  <div className="mt-2 h-[3px] rounded-full relative" style={{ background: 'var(--color-cream-border)' }}>
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
                        width: 6,
                        top: -2,
                        bottom: -2,
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
            <div className="spa-card p-3.5 flex flex-col gap-0.5">
              <div className="spa-label !text-[10px]">Temp</div>
              <div className="spa-value text-[34px] leading-tight text-charcoal">
                {fmt(latest.waterTemp, 1)}
                <span className="text-[12px] text-charcoal-whisper ml-1 font-body">°C</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-status-ok" />
                <span className="font-body text-[11px] text-charcoal-muted">stabil</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section break — Dagens underhåll */}
      <div className="flex items-center gap-3 mt-5 mb-2 px-0.5">
        <h2 className="spa-heading text-[20px] text-charcoal" style={{ fontWeight: 400 }}>
          Dagens underhåll
        </h2>
        <div className="flex-1 h-px bg-cream-border" />
        <span className="spa-mono text-charcoal-whisper">{doneCount}/{dailyTasks.length}</span>
      </div>

      {/* Ritual list */}
      <div className="spa-card overflow-hidden !p-0">
        {dailyTasks.map((task) => {
          const done = scheduleState.daily[task.id] ?? false
          return (
            <button
              key={task.id}
              onClick={() => toggleTask('daily', task.id)}
              className="w-full flex items-center gap-3 px-3.5 py-3 text-left border-b border-cream-border last:border-b-0 transition-opacity active:opacity-80"
            >
              <div
                className="w-[22px] h-[22px] rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-200"
                style={{
                  border: `1.5px solid ${done ? 'var(--color-status-ok)' : 'var(--color-charcoal-line)'}`,
                  background: done ? 'var(--color-status-ok)' : 'transparent',
                }}
              >
                {done && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="font-display text-[16px] leading-tight"
                  style={{
                    color: done ? 'var(--color-charcoal-whisper)' : 'var(--color-charcoal)',
                    textDecoration: done ? 'line-through' : 'none',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {task.name}
                </div>
                <div className="font-body text-[11px] text-charcoal-muted mt-0.5" style={{ letterSpacing: '-0.01em' }}>
                  {task.description}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Quote */}
      <div className="rounded-[18px] px-4 py-4 relative" style={{ background: 'var(--color-accent-soft)' }}>
        <svg className="absolute top-2.5 right-3 opacity-35 text-charcoal" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M7 8h4v6c0 2-1 3-3 3M14 8h4v6c0 2-1 3-3 3" strokeLinejoin="round" />
        </svg>
        <p className="font-display text-[15px] italic text-charcoal leading-relaxed" style={{ fontWeight: 300, letterSpacing: '-0.01em' }}>
          Vatten är mjukast, men det sliter bort sten. Underhåll är inte kamp — det är rytm.
        </p>
      </div>

      {/* Primary CTA */}
      <Link
        to="/logg/ny"
        className="flex items-center justify-center gap-2 w-full py-4 bg-charcoal text-cream rounded-full font-body text-[15px] tracking-tight transition-opacity duration-200 active:opacity-80 shadow-inset-btn"
        style={{ fontWeight: 500 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Ny loggning
      </Link>
    </div>
  )
}
