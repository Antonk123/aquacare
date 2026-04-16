import { useState, useEffect, useCallback } from 'react'
import { Download, BarChart3, Filter } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { TrendChart } from '../components/TrendChart'
import { api } from '../lib/api'
import { formatSwedishDecimal } from '../constants'
import type { WaterLogEntry } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReportSummary {
  totalLogs: number
  uniqueDays: number
  periodDays: number
  compliancePercent: number
  avgPh: number | null
  avgChlorine: number | null
  avgAlkalinity: number | null
}

interface Tub {
  id: string
  name: string
}

interface User {
  id: string
  name: string
}

type QuickRange = '7' | '30' | '90' | 'custom'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function subtractDays(n: number): string {
  return isoDate(new Date(Date.now() - n * 24 * 60 * 60 * 1000))
}

function mapApiLogToEntry(log: any): WaterLogEntry {
  return {
    id: log.id,
    date: log.date,
    note: log.note ?? undefined,
    tubId: log.tub_id ?? undefined,
    tubName: log.tub_name ?? undefined,
    ph: log.ph ?? undefined,
    freeChlorine: log.free_chlorine ?? undefined,
    bromine: log.bromine ?? undefined,
    totalAlkalinity: log.total_alkalinity ?? undefined,
    calciumHardness: log.calcium_hardness ?? undefined,
    tds: log.tds ?? undefined,
    waterTemp: log.water_temp ?? undefined,
  }
}

function complianceColor(pct: number): string {
  if (pct >= 80) return 'text-emerald-400'
  if (pct >= 50) return 'text-amber-400'
  return 'text-status-error'
}

function fmtVal(v: number | null | undefined): string {
  if (v === null || v === undefined) return '–'
  return formatSwedishDecimal(v)
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

function exportCsv(logs: any[]) {
  const headers = [
    'Datum', 'Tid', 'Bad', 'Person',
    'pH', 'Klor', 'Brom', 'Alkalinitet', 'Kalcium', 'TDS', 'Temp', 'Anteckning',
  ]

  const rows = logs.map((l) => {
    const d = new Date(l.date)
    const datum = d.toLocaleDateString('sv-SE')
    const tid = d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
    const sv = (v: number | null) => (v !== null && v !== undefined ? String(v).replace('.', ',') : '')
    return [
      datum, tid,
      l.tub_name ?? '',
      l.user_name ?? '',
      sv(l.ph), sv(l.free_chlorine), sv(l.bromine),
      sv(l.total_alkalinity), sv(l.calcium_hardness), sv(l.tds), sv(l.water_temp),
      `"${(l.note ?? '').replace(/"/g, '""')}"`,
    ].join(';')
  })

  const bom = '\uFEFF' // UTF-8 BOM for Excel compatibility
  const csv = bom + [headers.join(';'), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `aquacare-rapport-${isoDate(new Date())}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterPill({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[12px] whitespace-nowrap transition-colors duration-150 ${
        active ? 'bg-charcoal text-cream-light font-semibold' : 'bg-charcoal-whisper text-charcoal-muted'
      }`}
    >
      {label}
    </button>
  )
}

function SummaryCard({ summary, loading }: { summary: ReportSummary | null; loading: boolean }) {
  if (loading) {
    return (
      <GlassCard>
        <div className="h-24 flex items-center justify-center">
          <span className="text-charcoal-muted text-sm">Laddar...</span>
        </div>
      </GlassCard>
    )
  }

  if (!summary) return null

  return (
    <GlassCard className="bg-charcoal-whisper border-cream-border">
      <h2 className="text-[11px] uppercase tracking-[1.5px] text-charcoal-muted mb-3">Sammanfattning</h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {/* Total logs */}
        <div>
          <p className="text-[11px] text-charcoal-muted">Total loggar</p>
          <p className="text-2xl font-bold text-charcoal leading-none mt-0.5">{summary.totalLogs}</p>
        </div>

        {/* Compliance */}
        <div>
          <p className="text-[11px] text-charcoal-muted">
            Unika dagar{' '}
            <span className="text-charcoal-muted">av {summary.periodDays}</span>
          </p>
          <p className="text-2xl font-bold text-charcoal leading-none mt-0.5">
            {summary.uniqueDays}
            <span className={`text-sm font-semibold ml-1.5 ${complianceColor(summary.compliancePercent)}`}>
              {summary.compliancePercent}%
            </span>
          </p>
        </div>

        {/* Avg pH */}
        <div>
          <p className="text-[11px] text-charcoal-muted">Snitt pH</p>
          <p className="text-xl font-bold text-charcoal leading-none mt-0.5">{fmtVal(summary.avgPh)}</p>
        </div>

        {/* Avg chlorine */}
        <div>
          <p className="text-[11px] text-charcoal-muted">Snitt klor</p>
          <p className="text-xl font-bold text-blue-400 leading-none mt-0.5">
            {fmtVal(summary.avgChlorine)}
            {summary.avgChlorine !== null && <span className="text-xs font-normal text-charcoal-muted ml-1">mg/L</span>}
          </p>
        </div>

        {/* Avg alkalinity */}
        <div>
          <p className="text-[11px] text-charcoal-muted">Snitt alkalinitet</p>
          <p className="text-xl font-bold text-violet-400 leading-none mt-0.5">
            {fmtVal(summary.avgAlkalinity)}
            {summary.avgAlkalinity !== null && <span className="text-xs font-normal text-charcoal-muted ml-1">mg/L</span>}
          </p>
        </div>
      </div>
    </GlassCard>
  )
}

function LogList({ logs, loading }: { logs: any[]; loading: boolean }) {
  if (loading) {
    return (
      <GlassCard>
        <div className="h-16 flex items-center justify-center">
          <span className="text-charcoal-muted text-sm">Laddar...</span>
        </div>
      </GlassCard>
    )
  }

  if (logs.length === 0) {
    return (
      <GlassCard>
        <p className="text-charcoal-muted text-sm text-center py-4">Inga loggar i valt intervall</p>
      </GlassCard>
    )
  }

  return (
    <GlassCard>
      <h2 className="text-[11px] uppercase tracking-[1.5px] text-charcoal-muted mb-3">Loggar</h2>
      <div className="space-y-2">
        {logs.map((log) => {
          const d = new Date(log.date)
          const datum = d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
          const tid = d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
          return (
            <div key={log.id} className="flex items-start gap-3 py-2 border-b border-cream-border last:border-0">
              {/* Date */}
              <div className="w-16 shrink-0">
                <p className="text-[11px] font-semibold text-charcoal">{datum}</p>
                <p className="text-[10px] text-charcoal-muted">{tid}</p>
              </div>

              {/* Tub / person */}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-charcoal truncate">{log.tub_name ?? '–'}</p>
                <p className="text-[10px] text-charcoal-muted truncate">{log.user_name}</p>
              </div>

              {/* Key values */}
              <div className="flex gap-2 shrink-0">
                {log.ph !== null && (
                  <div className="text-right">
                    <p className="text-[10px] text-charcoal-muted">pH</p>
                    <p className="text-[12px] font-semibold text-charcoal">{fmtVal(log.ph)}</p>
                  </div>
                )}
                {log.free_chlorine !== null && (
                  <div className="text-right">
                    <p className="text-[10px] text-charcoal-muted">Cl</p>
                    <p className="text-[12px] font-semibold text-blue-300">{fmtVal(log.free_chlorine)}</p>
                  </div>
                )}
                {log.total_alkalinity !== null && (
                  <div className="text-right">
                    <p className="text-[10px] text-charcoal-muted">Alk</p>
                    <p className="text-[12px] font-semibold text-violet-300">{fmtVal(log.total_alkalinity)}</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Reports() {
  const [quickRange, setQuickRange] = useState<QuickRange>('30')
  const [customFrom, setCustomFrom] = useState(subtractDays(30))
  const [customTo, setCustomTo] = useState(isoDate(new Date()))

  const [selectedTubId, setSelectedTubId] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')

  const [tubs, setTubs] = useState<Tub[]>([])
  const [users, setUsers] = useState<User[]>([])

  const [logs, setLogs] = useState<any[]>([])
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [loading, setLoading] = useState(false)

  const [showCustom, setShowCustom] = useState(false)

  // Derive actual from/to from quick range or custom inputs
  function getDateRange(): { from: string; to: string } {
    if (quickRange === 'custom') {
      return { from: customFrom, to: customTo }
    }
    const days = parseInt(quickRange, 10)
    return { from: subtractDays(days), to: isoDate(new Date()) }
  }

  // Fetch tubs + users once
  useEffect(() => {
    api.listTubs().then(setTubs).catch(() => {})
    api.listUsers().then(setUsers).catch(() => {})
  }, [])

  const fetchReport = useCallback(async () => {
    const { from, to } = getDateRange()
    setLoading(true)
    try {
      const data = await api.getReport({
        from,
        to,
        tubId: selectedTubId || undefined,
        userId: selectedUserId || undefined,
      })
      setLogs(data.logs)
      setSummary(data.summary)
    } catch {
      setLogs([])
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [quickRange, customFrom, customTo, selectedTubId, selectedUserId])

  // Re-fetch whenever filters change
  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const entries: WaterLogEntry[] = logs.map(mapApiLogToEntry)

  const { from, to } = getDateRange()

  return (
    <div className="p-5 space-y-4 relative pb-24">
      {/* Aurora glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[100px] bg-[radial-gradient(ellipse,rgba(232,201,122,0.07)_0%,transparent_70%)] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 size={20} className="text-charcoal shrink-0" />
        <h1 className="font-display text-xl text-charcoal font-bold tracking-wide">Rapporter</h1>
      </div>

      {/* Quick range pills */}
      <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' } as React.CSSProperties}>
        {([
          { key: '7', label: '7 dagar' },
          { key: '30', label: '30 dagar' },
          { key: '90', label: '90 dagar' },
          { key: 'custom', label: 'Anpassad' },
        ] as { key: QuickRange; label: string }[]).map(({ key, label }) => (
          <FilterPill
            key={key}
            label={label}
            active={quickRange === key}
            onClick={() => {
              setQuickRange(key)
              setShowCustom(key === 'custom')
            }}
          />
        ))}
      </div>

      {/* Custom date inputs */}
      {quickRange === 'custom' && showCustom && (
        <GlassCard className="!p-3">
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <label className="block text-[10px] text-charcoal-muted mb-1">Från</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                max={customTo}
                className="w-full bg-cream-light border border-cream-border rounded-lg px-3 py-2 text-sm text-charcoal focus:outline-none focus:shadow-focus-warm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] text-charcoal-muted mb-1">Till</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                min={customFrom}
                max={isoDate(new Date())}
                className="w-full bg-cream-light border border-cream-border rounded-lg px-3 py-2 text-sm text-charcoal focus:outline-none focus:shadow-focus-warm"
              />
            </div>
          </div>
        </GlassCard>
      )}

      {/* Tub + person filters */}
      {(tubs.length > 0 || users.length > 0) && (
        <GlassCard className="!p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Filter size={12} className="text-charcoal-muted" />
            <span className="text-[11px] uppercase tracking-[1.5px] text-charcoal-muted">Filter</span>
          </div>
          <div className="flex gap-3">
            {/* Tub filter */}
            {tubs.length > 0 && (
              <div className="flex-1">
                <label className="block text-[10px] text-charcoal-muted mb-1">Bad</label>
                <select
                  value={selectedTubId}
                  onChange={(e) => setSelectedTubId(e.target.value)}
                  className="w-full bg-cream-light border border-cream-border rounded-lg px-2 py-2 text-sm text-charcoal focus:outline-none focus:shadow-focus-warm"
                >
                  <option value="">Alla bad</option>
                  {tubs.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* User filter */}
            {users.length > 0 && (
              <div className="flex-1">
                <label className="block text-[10px] text-charcoal-muted mb-1">Person</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-cream-light border border-cream-border rounded-lg px-2 py-2 text-sm text-charcoal focus:outline-none focus:shadow-focus-warm"
                >
                  <option value="">Alla</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* Summary */}
      <SummaryCard summary={summary} loading={loading} />

      {/* Trend chart */}
      {!loading && entries.length >= 2 && (
        <TrendChart entries={entries} />
      )}

      {/* Log list */}
      <LogList logs={logs} loading={loading} />

      {/* CSV Export */}
      <button
        onClick={() => exportCsv(logs)}
        disabled={logs.length === 0}
        className="w-full flex items-center justify-center gap-2 min-h-[48px] rounded-xl font-semibold text-cream-light transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: logs.length === 0
            ? 'rgba(232,201,122,0.4)'
            : 'linear-gradient(135deg, #E8C97A 0%, #D4A853 100%)',
        }}
      >
        <Download size={16} />
        Exportera CSV
        {logs.length > 0 && (
          <span className="text-xs font-normal opacity-70">({logs.length} rader)</span>
        )}
      </button>

      {/* Period label */}
      <p className="text-center text-[11px] text-charcoal-muted">
        {new Date(from).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
        {' – '}
        {new Date(to).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
    </div>
  )
}
