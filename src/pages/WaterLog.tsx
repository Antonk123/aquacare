import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useWaterLog } from '../hooks/useWaterLog'
import { OPTIMAL_RANGES, getValueStatus } from '../constants'
import { api } from '../lib/api'
import type { ValueStatus } from '../types'

interface Tub {
  id: string
  name: string
}

function fmt(v: number | undefined, decimals = 1): string {
  if (v == null) return '—'
  return v.toFixed(decimals).replace('.', ',')
}

export default function WaterLog() {
  const { entries, deleteEntry } = useWaterLog()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [tubs, setTubs] = useState<Tub[]>([])
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    api.listTubs().then(setTubs).catch(() => {})
  }, [])

  const filtered = filter === 'all' ? entries : entries.filter((e) => e.tubId === filter)

  // Group by month
  const byMonth: Record<string, typeof entries> = {}
  filtered.forEach((r) => {
    const d = new Date(r.date)
    const key = d.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' })
    ;(byMonth[key] = byMonth[key] || []).push(r)
  })

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
    <div className="px-4 pb-4 space-y-4">
      {/* Header */}
      <div className="px-1 pt-2 pb-2">
        <div className="spa-label">Vattenlogg</div>
        <h1 className="spa-heading text-[32px] mt-1.5 text-charcoal">
          Tunnans minne<span className="text-accent">.</span>
        </h1>
        <div className="font-body text-[13px] text-charcoal-muted mt-1.5" style={{ letterSpacing: '-0.01em' }}>
          {filtered.length} noteringar · senaste 7 dagar
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5">
        {[{ id: 'all', label: 'Alla' }, ...tubs.map((t) => ({ id: t.id, label: t.name }))].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={filter === t.id ? 'spa-pill spa-pill-active' : 'spa-pill spa-pill-inactive'}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Entries grouped by month */}
      {Object.keys(byMonth).length === 0 ? (
        <div className="spa-card p-8 text-center">
          <p className="text-charcoal-muted font-body text-[14px]">Inga loggningar ännu</p>
        </div>
      ) : (
        Object.entries(byMonth).map(([month, monthEntries]) => (
          <div key={month} className="space-y-2">
            <div className="flex items-baseline gap-2.5 px-0.5">
              <div className="font-display text-[15px] italic text-charcoal-muted" style={{ fontWeight: 300, letterSpacing: '-0.01em' }}>
                {month}
              </div>
              <div className="flex-1 h-px bg-cream-border" />
            </div>
            <div className="spa-card overflow-hidden !p-0">
              {monthEntries.map((entry, i) => {
                const d = new Date(entry.date)
                const day = d.getDate()
                const time = d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
                const { status, warnings } = getEntryStatus(entry)

                return (
                  <Link
                    key={entry.id}
                    to={`/logg/redigera/${entry.id}`}
                    className="w-full flex gap-3.5 items-start text-left px-4 py-3.5"
                    style={{
                      borderBottom: i < monthEntries.length - 1 ? '0.5px solid var(--color-cream-border)' : 'none',
                    }}
                  >
                    {/* Large date */}
                    <div className="spa-value text-[32px] leading-none text-charcoal min-w-[36px]" style={{ fontWeight: 300, letterSpacing: '-0.04em' }}>
                      {day}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-body text-[11px] text-charcoal-muted" style={{ letterSpacing: '0.05em' }}>{time}</span>
                        {entry.tubName && (
                          <span className="font-body text-[10px] px-1.5 py-0.5 rounded bg-accent-soft text-charcoal" style={{ letterSpacing: '0.03em' }}>
                            {entry.tubName}
                          </span>
                        )}
                        {status === 'ok' ? (
                          <span className="w-[5px] h-[5px] rounded-full bg-status-ok" />
                        ) : (
                          <span className="font-body text-[10px]" style={{ color: status === 'error' ? 'var(--color-status-error)' : 'var(--color-status-warn)', letterSpacing: '0.03em' }}>
                            {warnings} varning{warnings > 1 ? 'ar' : ''}
                          </span>
                        )}
                      </div>
                      {/* Values row */}
                      <div className="flex gap-3.5 mt-1.5 spa-mono text-[12px] text-charcoal-muted" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {OPTIMAL_RANGES.map((range) => {
                          const val = entry[range.key] as number | undefined
                          if (val === undefined) return null
                          const s = getValueStatus(range, val)
                          return (
                            <div key={range.key}>
                              <span className="opacity-55 text-[9px]" style={{ letterSpacing: '0.05em' }}>
                                {range.label.slice(0, 2).toUpperCase()}
                              </span>
                              <span
                                className="ml-1"
                                style={{ color: s === 'ok' ? 'var(--color-charcoal)' : s === 'warn' ? 'var(--color-status-warn)' : 'var(--color-status-error)' }}
                              >
                                {fmt(val, range.key === 'totalAlkalinity' ? 0 : 1)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                      {/* Note */}
                      {entry.note && (
                        <div className="mt-2 font-display text-[13px] italic text-charcoal-muted leading-snug" style={{ fontWeight: 300, letterSpacing: '-0.005em' }}>
                          &ldquo;{entry.note}&rdquo;
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))
      )}

      {/* FAB */}
      <Link
        to="/logg/ny"
        className="fixed bottom-28 right-5 z-20 w-14 h-14 rounded-full bg-charcoal text-cream flex items-center justify-center shadow-lg active:opacity-80 transition-opacity"
        style={{ boxShadow: '0 8px 20px rgba(0,0,0,0.18), inset 0 0.5px 0 rgba(255,255,255,0.15)' }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Link>

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
