import { useState } from 'react'
import { useSchedule } from '../hooks/useSchedule'
import { SCHEDULE_TASKS } from '../constants'
import type { SchedulePeriod } from '../types'

const PERIODS: { id: SchedulePeriod; label: string }[] = [
  { id: 'daily', label: 'Dagligen' },
  { id: 'weekly', label: 'Veckovis' },
]

export default function Schedule() {
  const [activePeriod, setActivePeriod] = useState<SchedulePeriod>('daily')
  const { state, toggleTask, getProgress } = useSchedule()
  const progress = getProgress(activePeriod)
  const tasks = SCHEDULE_TASKS[activePeriod]
  const percent = progress.total ? progress.done / progress.total : 0

  return (
    <div className="px-4 pb-4 space-y-4">
      {/* Header */}
      <div className="px-1 pt-2 pb-2">
        <div className="spa-label">Underhåll</div>
        <h1 className="spa-heading text-[32px] mt-1.5 text-charcoal">
          Omsorg i rytm<span className="text-accent">.</span>
        </h1>
      </div>

      {/* Progress ring */}
      <div className="flex justify-center mb-2">
        <div className="relative" style={{ width: 140, height: 140 }}>
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="60" fill="none" stroke="var(--color-cream-border)" strokeWidth="6" />
            <circle
              cx="70" cy="70" r="60"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 60 * percent} ${2 * Math.PI * 60}`}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
              style={{ transition: 'stroke-dasharray 0.5s' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="spa-value text-[38px] leading-none" style={{ fontWeight: 300, letterSpacing: '-0.03em' }}>
              {progress.done}
              <span className="text-charcoal-whisper text-[20px]">/{progress.total}</span>
            </div>
            <div className="spa-label !text-[10px] mt-0.5">avklarade</div>
          </div>
        </div>
      </div>

      {/* Period tabs */}
      <div className="flex gap-1 p-1 spa-card !rounded-full">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePeriod(p.id)}
            className="flex-1 py-2 rounded-full font-body text-[13px] transition-all duration-200"
            style={{
              background: activePeriod === p.id ? 'var(--color-charcoal)' : 'transparent',
              color: activePeriod === p.id ? 'var(--color-cream)' : 'var(--color-charcoal-muted)',
              fontWeight: activePeriod === p.id ? 500 : 400,
              letterSpacing: '-0.01em',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Tasks */}
      <div className="spa-card overflow-hidden !p-0">
        {tasks.map((task, i) => {
          const done = state[activePeriod][task.id] ?? false
          return (
            <button
              key={task.id}
              onClick={() => toggleTask(activePeriod, task.id)}
              className="w-full flex items-center gap-3 px-3.5 py-3 text-left transition-opacity active:opacity-80"
              style={{
                borderBottom: i < tasks.length - 1 ? '0.5px solid var(--color-cream-border)' : 'none',
              }}
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
    </div>
  )
}
