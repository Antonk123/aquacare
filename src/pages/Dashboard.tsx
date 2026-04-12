import { Link } from 'react-router-dom'
import { Droplets, Flame, Clock, Plus } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { StatusBadge } from '../components/StatusBadge'
import { useWaterLog } from '../hooks/useWaterLog'
import { useSchedule } from '../hooks/useSchedule'
import { OPTIMAL_RANGES, getValueStatus, formatSwedishDecimal, DEFAULT_SETTINGS, SCHEDULE_TASKS } from '../constants'
import type { ValueStatus } from '../types'

export default function Dashboard() {
  const { entries, streak } = useWaterLog()
  const { state: scheduleState } = useSchedule()
  const latest = entries[0]
  const nextTask = SCHEDULE_TASKS.daily.find((t) => !scheduleState.daily[t.id])

  function getOverallStatus(): ValueStatus {
    if (!latest) return 'ok'
    for (const range of OPTIMAL_RANGES) {
      const val = latest[range.key] as number | undefined
      if (val === undefined) continue
      const s = getValueStatus(range, val)
      if (s === 'error') return 'error'
      if (s === 'warn') return 'warn'
    }
    return 'ok'
  }

  return (
    <div className="p-5 space-y-3">
      {/* Header */}
      <div className="text-center mb-5">
        <h1 className="font-display text-2xl text-gold tracking-wider font-bold">AquaCare</h1>
        <p className="text-xs text-slate-400 mt-1 tracking-wide">{DEFAULT_SETTINGS.spaName}</p>
      </div>

      {/* Water Status */}
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Droplets size={16} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Vattenstatus</span>
          </div>
          <StatusBadge status={getOverallStatus()} />
        </div>
        {latest ? (
          <div className="grid grid-cols-3 gap-2.5">
            {OPTIMAL_RANGES.slice(0, 3).map((range) => {
              const val = latest[range.key] as number | undefined
              if (val === undefined) return null
              const status = getValueStatus(range, val)
              const statusColor = status === 'ok' ? 'text-status-ok' : status === 'warn' ? 'text-status-warn' : 'text-status-error'
              const statusBg = status === 'ok' ? 'bg-status-ok/6' : status === 'warn' ? 'bg-status-warn/6' : 'bg-status-error/6'
              return (
                <div key={range.key} className={`${statusBg} rounded-xl p-2.5 text-center`}>
                  <div className={`text-[22px] font-bold ${statusColor}`}>{formatSwedishDecimal(val)}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{range.label}</div>
                  <div className="h-[3px] bg-white/5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        status === 'ok' ? 'bg-status-ok' : status === 'warn' ? 'bg-status-warn' : 'bg-status-error'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(10, range.max ? (val / range.max) * 100 : 50))}%`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-4">Ingen loggning ännu. Logga ditt första vattentest!</p>
        )}
      </GlassCard>

      {/* Streak + Next Task */}
      <div className="grid grid-cols-[1fr_1.4fr] gap-2.5">
        <GlassCard className="flex flex-col items-center justify-center">
          <Flame size={24} className="text-gold" />
          <div className="text-2xl font-bold text-gold mt-1">{streak.currentStreak}</div>
          <div className="text-[11px] text-slate-400">dagar i rad</div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Clock size={14} className="text-slate-400" />
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Nästa uppgift</span>
          </div>
          {nextTask ? (
            <>
              <div className="text-sm text-slate-200 font-medium leading-snug">{nextTask.name}</div>
              <div className="text-xs text-gold font-semibold mt-1.5">Idag</div>
            </>
          ) : (
            <>
              <div className="text-sm text-slate-200 font-medium">Alla klara!</div>
              <div className="text-xs text-status-ok font-semibold mt-1.5">Bra jobbat</div>
            </>
          )}
        </GlassCard>
      </div>

      {/* CTA */}
      <Link
        to="/logg/ny"
        className="flex items-center justify-center gap-2 w-full min-h-[48px] bg-gradient-to-br from-gold to-gold-dark text-navy rounded-[14px] font-bold text-[15px] tracking-wide shadow-[0_4px_16px_rgba(232,201,122,0.2)] transition-transform duration-200 active:scale-[0.98]"
      >
        <Plus size={18} strokeWidth={2.5} />
        Logga vattentest
      </Link>
    </div>
  )
}
