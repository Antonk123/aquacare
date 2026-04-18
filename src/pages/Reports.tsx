import { useState, useEffect, useCallback } from 'react'
import { TrendChart } from '../components/TrendChart'
import { api } from '../lib/api'
import { formatSwedishDecimal } from '../constants'
import type { WaterLogEntry } from '../types'

interface ReportSummary {
  totalLogs: number
  uniqueDays: number
  periodDays: number
  compliancePercent: number
  avgPh: number | null
  avgChlorine: number | null
  avgAlkalinity: number | null
}

type QuickRange = '7' | '30' | '90' | 'custom'

function isoDate(d: Date): string { return d.toISOString().split('T')[0] }
function subtractDays(n: number): string { return isoDate(new Date(Date.now() - n * 24 * 60 * 60 * 1000)) }
function fmtVal(v: number | null | undefined): string {
  if (v === null || v === undefined) return '–'
  return formatSwedishDecimal(v)
}

function mapApiLogToEntry(log: any): WaterLogEntry {
  return {
    id: log.id, date: log.date, note: log.note ?? undefined,
    tubId: log.tub_id ?? undefined, tubName: log.tub_name ?? undefined,
    ph: log.ph ?? undefined, freeChlorine: log.free_chlorine ?? undefined,
    bromine: log.bromine ?? undefined, totalAlkalinity: log.total_alkalinity ?? undefined,
    calciumHardness: log.calcium_hardness ?? undefined, tds: log.tds ?? undefined,
    waterTemp: log.water_temp ?? undefined,
  }
}

function exportCsv(logs: any[]) {
  const headers = ['Datum', 'Tid', 'Bad', 'Person', 'pH', 'Klor', 'Brom', 'Alkalinitet', 'Kalcium', 'TDS', 'Temp', 'Anteckning']
  const rows = logs.map((l) => {
    const d = new Date(l.date)
    const sv = (v: number | null) => (v !== null && v !== undefined ? String(v).replace('.', ',') : '')
    return [d.toLocaleDateString('sv-SE'), d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
      l.tub_name ?? '', l.user_name ?? '', sv(l.ph), sv(l.free_chlorine), sv(l.bromine),
      sv(l.total_alkalinity), sv(l.calcium_hardness), sv(l.tds), sv(l.water_temp),
      `"${(l.note ?? '').replace(/"/g, '""')}"`].join(';')
  })
  const bom = '\uFEFF'
  const csv = bom + [headers.join(';'), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `aquacare-rapport-${isoDate(new Date())}.csv`; a.click()
  URL.revokeObjectURL(url)
}

export default function Reports() {
  const [quickRange, setQuickRange] = useState<QuickRange>('7')
  const [customFrom, setCustomFrom] = useState(subtractDays(30))
  const [customTo, setCustomTo] = useState(isoDate(new Date()))
  const [selectedTubId, setSelectedTubId] = useState('')
  const [tubs, setTubs] = useState<{ id: string; name: string }[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [loading, setLoading] = useState(false)

  function getDateRange() {
    if (quickRange === 'custom') return { from: customFrom, to: customTo }
    return { from: subtractDays(parseInt(quickRange, 10)), to: isoDate(new Date()) }
  }

  useEffect(() => { api.listTubs().then(setTubs).catch(() => {}) }, [])

  const fetchReport = useCallback(async () => {
    const { from, to } = getDateRange()
    setLoading(true)
    try {
      const data = await api.getReport({ from, to, tubId: selectedTubId || undefined })
      setLogs(data.logs); setSummary(data.summary)
    } catch { setLogs([]); setSummary(null) }
    finally { setLoading(false) }
  }, [quickRange, customFrom, customTo, selectedTubId])

  useEffect(() => { fetchReport() }, [fetchReport])

  const entries: WaterLogEntry[] = logs.map(mapApiLogToEntry)

  return (
    <div className="px-4 pb-4 space-y-4">
      {/* Header */}
      <div className="px-1 pt-2 pb-2">
        <div className="spa-label">Trender</div>
        <h1 className="spa-heading text-[32px] mt-1.5 text-charcoal">
          7 dagars trender<span className="text-accent">.</span>
        </h1>
      </div>

      {/* Quick range pills */}
      <div className="flex gap-1.5">
        {([
          { key: '7' as QuickRange, label: '7 dagar' },
          { key: '30' as QuickRange, label: '30 dagar' },
          { key: '90' as QuickRange, label: '90 dagar' },
          { key: 'custom' as QuickRange, label: 'Anpassad' },
        ]).map(({ key, label }) => (
          <button key={key} onClick={() => setQuickRange(key)}
            className={quickRange === key ? 'spa-pill spa-pill-active' : 'spa-pill spa-pill-inactive'}>
            {label}
          </button>
        ))}
      </div>

      {/* Custom date inputs */}
      {quickRange === 'custom' && (
        <div className="spa-card !p-3 flex gap-3">
          <div className="flex-1">
            <div className="spa-label !text-[10px] mb-1">Från</div>
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} max={customTo}
              className="w-full bg-cream border border-cream-border rounded-xl px-3 py-2 text-sm text-charcoal focus:outline-none" />
          </div>
          <div className="flex-1">
            <div className="spa-label !text-[10px] mb-1">Till</div>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} min={customFrom} max={isoDate(new Date())}
              className="w-full bg-cream border border-cream-border rounded-xl px-3 py-2 text-sm text-charcoal focus:outline-none" />
          </div>
        </div>
      )}

      {/* Tub filter */}
      {tubs.length > 0 && (
        <div className="flex gap-1.5">
          <button onClick={() => setSelectedTubId('')}
            className={!selectedTubId ? 'spa-pill spa-pill-active' : 'spa-pill spa-pill-inactive'}>Alla</button>
          {tubs.map((t) => (
            <button key={t.id} onClick={() => setSelectedTubId(t.id)}
              className={selectedTubId === t.id ? 'spa-pill spa-pill-active' : 'spa-pill spa-pill-inactive'}>{t.name}</button>
          ))}
        </div>
      )}

      {/* Averages grid */}
      {summary && !loading && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'pH', value: fmtVal(summary.avgPh) },
            { label: 'Klor', value: fmtVal(summary.avgChlorine) },
            { label: 'Alk', value: fmtVal(summary.avgAlkalinity) },
            { label: 'Loggar', value: String(summary.totalLogs) },
          ].map((item) => (
            <div key={item.label} className="spa-card !p-2.5">
              <div className="spa-label !text-[9px]">Ø {item.label}</div>
              <div className="spa-value text-[20px] mt-0.5" style={{ fontWeight: 400, letterSpacing: '-0.02em' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="spa-card p-8 text-center">
          <span className="text-charcoal-muted font-body text-[14px]">Laddar...</span>
        </div>
      )}

      {/* Trend chart */}
      {!loading && entries.length >= 2 && <TrendChart entries={entries} />}

      {/* Water age */}
      <div className="spa-card !p-4 flex items-center gap-3.5">
        <div
          className="w-[52px] h-[52px] rounded-full flex-shrink-0 flex items-center justify-center text-white"
          style={{
            background: 'radial-gradient(ellipse at 30% 20%, var(--color-water) 0%, var(--color-accent) 60%, oklch(0.35 0.06 235) 100%)',
            fontFamily: "'Newsreader', Georgia, serif", fontSize: 22, fontWeight: 300, letterSpacing: '-0.02em',
          }}
        >
          21
        </div>
        <div className="flex-1">
          <div className="spa-label !text-[10px]">Vattnets ålder</div>
          <div className="font-display text-[17px] text-charcoal mt-0.5" style={{ fontWeight: 400, letterSpacing: '-0.01em' }}>
            21 dagar · nästa byte om 69 dagar
          </div>
        </div>
      </div>

      {/* CSV export */}
      <button
        onClick={() => exportCsv(logs)}
        disabled={logs.length === 0}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-full font-body text-[15px] text-cream transition-all active:opacity-80 disabled:opacity-40 shadow-inset-btn"
        style={{
          background: logs.length === 0 ? 'var(--color-charcoal-muted)' : 'var(--color-charcoal)',
          fontWeight: 500,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
        Exportera CSV
        {logs.length > 0 && <span className="text-[12px] opacity-70">({logs.length} rader)</span>}
      </button>
    </div>
  )
}
