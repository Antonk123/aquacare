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
    <div className="p-5 space-y-5">
      <h1 className="font-display text-[28px] leading-none font-semibold text-charcoal tracking-[-0.035em]">
        Underhåll
      </h1>

      <div className="flex flex-col items-center py-2">
        <ProgressRing
          percent={progress.percent}
          label={`${progress.done} av ${progress.total} ${PERIOD_LABELS[
            activePeriod
          ].toLowerCase()} uppgifter klara`}
        />
      </div>

      <div className="flex gap-1 bg-charcoal-whisper border border-cream-border rounded-lg p-1">
        {PERIODS.map((period) => (
          <button
            key={period}
            onClick={() => setActivePeriod(period)}
            className={`flex-1 text-center py-2 rounded-md text-[12px] font-medium transition-all duration-200 min-h-[40px] tracking-tight ${
              activePeriod === period
                ? 'bg-cream-light text-charcoal shadow-sm border border-cream-border'
                : 'text-charcoal-muted'
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
              className={`w-full text-left rounded-xl p-3 flex items-start gap-3 transition-all duration-200 active:opacity-80 border ${
                done
                  ? 'bg-status-ok/5 border-status-ok/20'
                  : 'bg-cream border-cream-border'
              }`}
            >
              <div
                className={`w-[22px] h-[22px] rounded-md flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors duration-200 ${
                  done
                    ? 'bg-status-ok border border-status-ok'
                    : 'border-2 border-charcoal-line'
                }`}
              >
                {done && <Check size={14} className="text-cream-light" strokeWidth={3} />}
              </div>
              <div>
                <div
                  className={`text-[14px] tracking-tight ${
                    done
                      ? 'text-charcoal-muted line-through'
                      : 'text-charcoal font-medium'
                  }`}
                >
                  {task.name}
                </div>
                <div className="text-[11px] text-charcoal-muted mt-0.5">
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
