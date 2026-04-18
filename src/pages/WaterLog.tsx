import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Info, Check, AlertTriangle, Trash2, Pencil } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
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

      {/* Tub filter pills — only when 2+ tubs */}
      {tubs.length >= 2 && (
        <div
          className="flex gap-2 overflow-x-auto pb-0.5"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as any}
        >
          <button
            onClick={() => selectTub('')}
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
              onClick={() => selectTub(tub.id)}
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

      <div className="flex items-center gap-3 px-1 text-[11px] text-charcoal-muted">
        <Info size={12} className="flex-shrink-0" strokeWidth={1.75} />
        {OPTIMAL_RANGES.map((r, i) => (
          <span key={r.key} className="tabular-nums whitespace-nowrap">
            {r.label}{' '}
            <span className="text-charcoal font-medium">
              {r.min !== undefined ? formatSwedishDecimal(r.min) : ''}
              {r.min !== undefined && r.max !== undefined ? '–' : ''}
              {r.max !== undefined
                ? `${r.min === undefined ? '<' : ''}${formatSwedishDecimal(r.max)}`
                : ''}
            </span>
            {i < OPTIMAL_RANGES.length - 1 && <span className="ml-3 text-charcoal-line">·</span>}
          </span>
        ))}
      </div>

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
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-charcoal font-medium tracking-tight">{formatDate(entry.date)}</span>
                    {entry.tubName && (
                      <span className="text-[10px] bg-charcoal/5 text-charcoal-muted px-2 py-0.5 rounded-md font-medium">{entry.tubName}</span>
                    )}
                  </div>
                  {status === 'ok' ? (
                    <span className="inline-flex items-center gap-1 bg-status-ok/10 text-status-ok text-[10px] px-2 py-0.5 rounded-md font-medium">
                      <Check size={10} strokeWidth={2.5} />
                      OK
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-status-alert/10 text-status-alert text-[10px] px-2 py-0.5 rounded-md font-medium">
                      <AlertTriangle size={10} strokeWidth={2.5} />
                      {warnings} varning{warnings > 1 ? 'ar' : ''}
                    </span>
                  )}
                </div>
                {entry.note && (
                  <p className="text-xs text-charcoal-muted italic mb-3">{entry.note}</p>
                )}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {OPTIMAL_RANGES.map((range) => {
                    const val = entry[range.key] as number | undefined
                    if (val === undefined) return null
                    const s = getValueStatus(range, val)
                    const color = s === 'ok' ? 'text-charcoal' : s === 'warn' ? 'text-status-warn' : 'text-status-error'
                    return (
                      <div key={range.key} className="text-center">
                        <div className={`text-[18px] font-semibold tabular-nums tracking-tight leading-tight ${color}`}>
                          {formatSwedishDecimal(val)}
                        </div>
                        <div className="text-[10px] text-charcoal-muted mt-0.5">{range.label}</div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center justify-end gap-1 border-t border-cream-border pt-2 -mb-1">
                  <Link
                    to={`/logg/redigera/${entry.id}`}
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md transition-colors duration-200 hover:bg-charcoal-hover active:opacity-80"
                    aria-label="Redigera loggning"
                  >
                    <Pencil size={14} className="text-charcoal-muted" strokeWidth={1.75} />
                  </Link>
                  <button
                    onClick={() => setDeleteId(entry.id)}
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md transition-colors duration-200 hover:bg-charcoal-hover active:opacity-80"
                    aria-label="Ta bort loggning"
                  >
                    <Trash2 size={14} className="text-charcoal-muted" strokeWidth={1.75} />
                  </button>
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
