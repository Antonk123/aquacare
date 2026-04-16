import { useState } from 'react'
import type { WaterLogEntry } from '../types'
import { GlassCard } from './GlassCard'
import { formatSwedishDecimal } from '../constants'

interface MetricConfig {
  key: keyof WaterLogEntry
  label: string
  minY: number
  maxY: number
  optMin?: number
  optMax?: number
  color: string
  fillId: string
}

const METRICS: MetricConfig[] = [
  { key: 'ph', label: 'pH', minY: 6.8, maxY: 8.0, optMin: 7.2, optMax: 7.6, color: '#E8C97A', fillId: 'trendFillPh' },
  { key: 'freeChlorine', label: 'Klor', minY: 0, maxY: 10, optMin: 3, optMax: 5, color: '#60A5FA', fillId: 'trendFillCl' },
  { key: 'totalAlkalinity', label: 'Alkalinitet', minY: 0, maxY: 240, optMin: 80, optMax: 120, color: '#A78BFA', fillId: 'trendFillAlk' },
]

function MiniChart({ entries, metric }: { entries: WaterLogEntry[]; metric: MetricConfig }) {
  const filtered = entries
    .filter((e) => e[metric.key] !== undefined)
    .slice(0, 7)
    .reverse()

  if (filtered.length < 2) {
    return <p className="text-xs text-charcoal-muted text-center py-3">Logga fler test för att se trenden</p>
  }

  const values = filtered.map((e) => e[metric.key] as number)
  const { minY, maxY } = metric
  const range = maxY - minY

  const w = 260
  const h = 50
  const padX = 15
  const usableW = w - padX * 2

  const points = values.map((v, i) => {
    const x = padX + (i / (values.length - 1)) * usableW
    const y = h - ((v - minY) / range) * h
    return { x, y: Math.max(2, Math.min(h - 2, y)) }
  })

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ')
  const areaPath = `M${points[0].x},${points[0].y} ${points.map((p) => `L${p.x},${p.y}`).join(' ')} L${points[points.length - 1].x},${h} L${points[0].x},${h} Z`

  const optTop = metric.optMax !== undefined ? h - ((metric.optMax - minY) / range) * h : 0
  const optBottom = metric.optMin !== undefined ? h - ((metric.optMin - minY) / range) * h : h
  const showOpt = metric.optMin !== undefined && metric.optMax !== undefined

  const last = points[points.length - 1]

  const labels = filtered.map((e) => {
    const d = new Date(e.date)
    return d.toLocaleDateString('sv-SE', { weekday: 'short' }).replace('.', '')
  })

  return (
    <svg viewBox={`0 0 ${w} ${h + 14}`} className="w-full" style={{ height: 60 }}>
      <defs>
        <linearGradient id={metric.fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={metric.color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={metric.color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {showOpt && (
        <>
          <rect x="0" y={optTop} width={w} height={optBottom - optTop} fill="var(--color-status-ok)" fillOpacity="0.1" rx="2" />
          <text x={w - 2} y={optTop - 1} fill="var(--color-charcoal-muted)" fontSize="5" textAnchor="end">
            {formatSwedishDecimal(metric.optMax!)}
          </text>
          <text x={w - 2} y={optBottom + 6} fill="var(--color-charcoal-muted)" fontSize="5" textAnchor="end">
            {formatSwedishDecimal(metric.optMin!)}
          </text>
        </>
      )}

      <path d={areaPath} fill={`url(#${metric.fillId})`} />

      <polyline
        points={polyline}
        fill="none"
        stroke={metric.color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx={last.x} cy={last.y} r="3.5" fill="var(--color-cream)" stroke={metric.color} strokeWidth="1.75" />

      {labels.map((label, i) => (
        <text key={i} x={points[i].x} y={h + 10} fill="var(--color-charcoal-muted)" fontSize="5.5" textAnchor="middle">
          {i === labels.length - 1 ? 'Nu' : label}
        </text>
      ))}
    </svg>
  )
}

export function TrendChart({ entries }: { entries: WaterLogEntry[] }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const active = METRICS[activeIdx]

  return (
    <GlassCard>
      <div className="flex justify-between items-center mb-2">
        <div className="flex gap-1">
          {METRICS.map((m, i) => (
            <button
              key={m.key}
              onClick={() => setActiveIdx(i)}
              className={`text-[10px] font-medium uppercase tracking-[1.5px] px-2 py-1 rounded-lg transition-colors duration-200 ${
                i === activeIdx
                  ? 'text-charcoal bg-charcoal/10'
                  : 'text-charcoal-muted hover:text-charcoal'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="text-[10px] text-charcoal-muted tabular-nums">
          {entries.filter((e) => e[active.key] !== undefined).slice(0, 7).length} test
        </div>
      </div>
      <MiniChart entries={entries} metric={active} />
    </GlassCard>
  )
}
