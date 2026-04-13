import { Link } from 'react-router-dom'
import { Flame, Plus, Check, Settings } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { SmartStatus } from '../components/SmartStatus'
import { TrendChart } from '../components/TrendChart'
import { WaterAge } from '../components/WaterAge'
import { useWaterLog } from '../hooks/useWaterLog'
import { useSchedule } from '../hooks/useSchedule'
import { OPTIMAL_RANGES, getValueStatus, formatSwedishDecimal, DEFAULT_SETTINGS, SCHEDULE_TASKS } from '../constants'

export default function Dashboard() {
  const { entries, streak } = useWaterLog()
  const { state: scheduleState, toggleTask } = useSchedule()
  const latest = entries[0]
  const dailyTasks = SCHEDULE_TASKS.daily
  const doneCount = dailyTasks.filter((t) => scheduleState.daily[t.id]).length

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
            {DEFAULT_SETTINGS.spaName}
          </span>
        </div>
      </div>

      {/* Hero Status */}
      <SmartStatus latest={latest} />

      {/* Bento grid — values */}
      {latest && (
        <div className="grid grid-cols-2 gap-2">
          {OPTIMAL_RANGES.slice(0, 3).map((range, i) => {
            const val = latest[range.key] as number | undefined
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
      <TrendChart entries={entries} />

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
