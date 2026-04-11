import { useState } from 'react'
import { Check } from 'lucide-react'
import { ProgressRing } from '../components/ProgressRing'
import { useSchedule } from '../hooks/useSchedule'
import { SCHEDULE_TASKS, PERIOD_LABELS } from '../constants'
import type { SchedulePeriod } from '../types'

const PERIODS: SchedulePeriod[] = ['daily', 'weekly', 'monthly', 'quarterly']

export default function Schedule() {
  const [activePeriod, setActivePeriod] = useState<SchedulePeriod>('daily')
  const { state, toggleTask, getProgress } = useSchedule()
  const progress = getProgress(activePeriod)
  const tasks = SCHEDULE_TASKS[activePeriod]

  return (
    <div className="p-5 space-y-4">
      <h1 className="font-display text-xl text-gold font-bold">Underhåll</h1>

      <ProgressRing
        percent={progress.percent}
        label={`${progress.done} av ${progress.total} ${PERIOD_LABELS[activePeriod].toLowerCase()} uppgifter klara`}
      />

      <div className="flex gap-1 bg-white/5 rounded-xl p-1">
        {PERIODS.map((period) => (
          <button
            key={period}
            onClick={() => setActivePeriod(period)}
            className={`flex-1 text-center py-2 rounded-lg text-xs font-semibold transition-colors duration-200 min-h-[44px] ${
              activePeriod === period ? 'bg-gold/15 text-gold' : 'text-slate-500'
            }`}
          >
            {PERIOD_LABELS[period]}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {tasks.map((task) => {
          const done = state[activePeriod][task.id] ?? false
          return (
            <button
              key={task.id}
              onClick={() => toggleTask(activePeriod, task.id)}
              className={`w-full text-left rounded-xl p-3 flex items-start gap-3 transition-colors duration-200 border ${
                done
                  ? 'bg-status-ok/6 border-status-ok/15'
                  : 'bg-glass-surface border-glass-border'
              }`}
            >
              <div
                className={`w-[22px] h-[22px] rounded-md flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors duration-200 ${
                  done ? 'bg-status-ok' : 'border-2 border-gold/30'
                }`}
              >
                {done && <Check size={14} className="text-navy" strokeWidth={3} />}
              </div>
              <div>
                <div className={`text-[13px] ${done ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                  {task.name}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{task.description}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
