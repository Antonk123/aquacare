import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Info, Check, AlertTriangle, Trash2, Pencil } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { ValueBadge } from '../components/ValueBadge'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useWaterLog } from '../hooks/useWaterLog'
import { OPTIMAL_RANGES, getValueStatus, formatSwedishDecimal } from '../constants'
import type { ValueStatus } from '../types'

function formatDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0]
  const dateStr = iso.split('T')[0]
  const time = date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })

  if (dateStr === today) return `Idag, ${time}`
  if (dateStr === yesterday) return `Igår, ${time}`
  return `${date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}, ${time}`
}

export default function WaterLog() {
  const { entries, deleteEntry } = useWaterLog()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function getEntryStatus(entry: typeof entries[0]): { status: ValueStatus; warnings: number } {
    let warnings = 0
    let hasError = false
    for (const range of OPTIMAL_RANGES) {
      const val = entry[range.key] as number | undefined
      if (val === undefined) continue
      const s = getValueStatus(range, val)
      if (s === 'error') hasError = true
      if (s !== 'ok') warnings++
    }
    return { status: hasError ? 'error' : warnings > 0 ? 'warn' : 'ok', warnings }
  }

  return (
    <div className="p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl text-gold font-bold">Vattenlogg</h1>
        <Link
          to="/logg/ny"
          className="flex items-center gap-1.5 bg-gradient-to-br from-gold to-gold-dark text-navy rounded-xl px-4 font-bold text-[13px] min-h-[44px]"
        >
          <Plus size={16} strokeWidth={2.5} />
          Ny loggning
        </Link>
      </div>

      <GlassCard>
        <div className="flex items-center gap-1.5 mb-2">
          <Info size={14} className="text-gold" />
          <span className="text-[11px] text-gold uppercase tracking-wider font-semibold">Optimala värden</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
          {OPTIMAL_RANGES.map((r) => (
            <div key={r.key} className="flex justify-between">
              <span className="text-slate-400">{r.label}</span>
              <span className="text-slate-300">
                {r.min !== undefined ? formatSwedishDecimal(r.min) : ''}
                {r.min !== undefined && r.max !== undefined ? ' – ' : ''}
                {r.max !== undefined ? `${r.min === undefined ? '< ' : ''}${formatSwedishDecimal(r.max)}` : ''}
                {r.unit ? ` ${r.unit}` : ''}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">Senaste loggningar</div>

      {entries.length === 0 ? (
        <GlassCard className="text-center py-6">
          <p className="text-sm text-slate-400">Inga loggningar ännu</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const { status, warnings } = getEntryStatus(entry)
            return (
              <GlassCard key={entry.id} className="!bg-glass-surface/70">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] text-slate-300 font-semibold">{formatDate(entry.date)}</span>
                  <div className="flex items-center gap-2">
                  {status === 'ok' ? (
                    <span className="inline-flex items-center gap-1 bg-status-ok/12 text-status-ok text-[10px] px-2 py-0.5 rounded-lg font-semibold">
                      <Check size={10} strokeWidth={3} />
                      Alla optimala
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-status-alert/12 text-status-alert text-[10px] px-2 py-0.5 rounded-lg font-semibold">
                      <AlertTriangle size={10} strokeWidth={3} />
                      {warnings} varning{warnings > 1 ? 'ar' : ''}
                    </span>
                  )}
                  <Link
                    to={`/logg/redigera/${entry.id}`}
                    className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg transition-colors duration-200 active:scale-95"
                    aria-label="Redigera loggning"
                  >
                    <Pencil size={14} className="text-slate-600" />
                  </Link>
                  <button
                    onClick={() => setDeleteId(entry.id)}
                    className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg transition-colors duration-200 active:scale-95"
                    aria-label="Ta bort loggning"
                  >
                    <Trash2 size={14} className="text-slate-600" />
                  </button>
                  </div>
                </div>
                {entry.note && (
                  <p className="text-xs text-slate-400 italic mb-2">{entry.note}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {OPTIMAL_RANGES.map((range) => {
                    const val = entry[range.key] as number | undefined
                    if (val === undefined) return null
                    return (
                      <ValueBadge key={range.key} label={range.label} value={val} status={getValueStatus(range, val)} />
                    )
                  })}
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Ta bort loggning"
          message="Vill du verkligen ta bort denna vattenloggning? Det går inte att ångra."
          onConfirm={() => { deleteEntry(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
