import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Info, Check, AlertTriangle, Trash2, Pencil } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { ValueBadge } from '../components/ValueBadge'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useWaterLog } from '../hooks/useWaterLog'
import { OPTIMAL_RANGES, getValueStatus, formatSwedishDecimal } from '../constants'
import { api } from '../lib/api'
import type { ValueStatus } from '../types'

interface Tub {
  id: string
  name: string
}

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
  const [tubs, setTubs] = useState<Tub[]>([])
  const [selectedTubId, setSelectedTubId] = useState<string>('')

  useEffect(() => {
    api.listTubs().then(setTubs).catch(() => {})
  }, [])

  const filtered = selectedTubId ? entries.filter((e) => e.tubId === selectedTubId) : entries

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
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[28px] leading-none font-semibold text-charcoal tracking-[-0.035em]">
          Vattenlogg
        </h1>
        <Link
          to="/logg/ny"
          className="flex items-center gap-1.5 bg-charcoal text-cream-light rounded-md px-4 font-medium text-[13px] min-h-[40px] tracking-tight shadow-inset-btn active:opacity-80 transition-opacity"
        >
          <Plus size={16} strokeWidth={2} />
          Ny loggning
        </Link>
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

      <GlassCard>
        <div className="flex items-center gap-1.5 mb-2">
          <Info size={14} className="text-charcoal-muted" strokeWidth={1.75} />
          <span className="text-[11px] text-charcoal-muted uppercase tracking-[1.5px] font-medium">
            Optimala värden
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
          {OPTIMAL_RANGES.map((r) => (
            <div key={r.key} className="flex justify-between items-baseline">
              <span className="text-charcoal-muted">{r.label}</span>
              <span className="text-charcoal font-medium tabular-nums">
                {r.min !== undefined ? formatSwedishDecimal(r.min) : ''}
                {r.min !== undefined && r.max !== undefined ? ' – ' : ''}
                {r.max !== undefined
                  ? `${r.min === undefined ? '< ' : ''}${formatSwedishDecimal(r.max)}`
                  : ''}
                {r.unit ? ` ${r.unit}` : ''}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="text-[11px] text-charcoal-muted uppercase tracking-[1.5px] font-medium pt-1">
        Senaste loggningar
      </div>

      {filtered.length === 0 ? (
        <GlassCard className="text-center py-8">
          <p className="text-sm text-charcoal-muted">Inga loggningar ännu</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => {
            const { status, warnings } = getEntryStatus(entry)
            return (
              <GlassCard key={entry.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-charcoal font-medium tracking-tight">{formatDate(entry.date)}</span>
                    {entry.tubName && (
                      <span className="text-[10px] bg-charcoal/5 text-charcoal-muted px-2 py-0.5 rounded-md font-medium">{entry.tubName}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {status === 'ok' ? (
                      <span className="inline-flex items-center gap-1 bg-status-ok/10 text-status-ok text-[10px] px-2 py-0.5 rounded-md font-medium">
                        <Check size={10} strokeWidth={2.5} />
                        Alla optimala
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-status-alert/10 text-status-alert text-[10px] px-2 py-0.5 rounded-md font-medium">
                        <AlertTriangle size={10} strokeWidth={2.5} />
                        {warnings} varning{warnings > 1 ? 'ar' : ''}
                      </span>
                    )}
                    <Link
                      to={`/logg/redigera/${entry.id}`}
                      className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-md transition-colors duration-200 hover:bg-charcoal-hover active:opacity-80"
                      aria-label="Redigera loggning"
                    >
                      <Pencil size={14} className="text-charcoal-muted" strokeWidth={1.75} />
                    </Link>
                    <button
                      onClick={() => setDeleteId(entry.id)}
                      className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-md transition-colors duration-200 hover:bg-charcoal-hover active:opacity-80"
                      aria-label="Ta bort loggning"
                    >
                      <Trash2 size={14} className="text-charcoal-muted" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
                {entry.note && (
                  <p className="text-xs text-charcoal-muted italic mb-2">{entry.note}</p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {OPTIMAL_RANGES.map((range) => {
                    const val = entry[range.key] as number | undefined
                    if (val === undefined) return null
                    return (
                      <ValueBadge
                        key={range.key}
                        label={range.label}
                        value={val}
                        status={getValueStatus(range, val)}
                      />
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
