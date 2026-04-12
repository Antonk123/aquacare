import type { WaterLogEntry } from '../types'
import { GlassCard } from './GlassCard'

export function TrendChart({ entries }: { entries: WaterLogEntry[] }) {
  const phEntries = entries
    .filter((e) => e.ph !== undefined)
    .slice(0, 7)
    .reverse()

  if (phEntries.length < 2) {
    return (
      <GlassCard>
        <div className="text-[10px] text-gold font-semibold uppercase tracking-[1.5px] mb-2">pH-trend</div>
        <p className="text-xs text-slate-500 text-center py-3">Logga fler test för att se trenden</p>
      </GlassCard>
    )
  }

  const values = phEntries.map((e) => e.ph!)
  const minY = 6.8
  const maxY = 8.0
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

  const optTop = h - ((7.6 - minY) / range) * h
  const optBottom = h - ((7.2 - minY) / range) * h

  const last = points[points.length - 1]

  const labels = phEntries.map((e) => {
    const d = new Date(e.date)
    return d.toLocaleDateString('sv-SE', { weekday: 'short' }).replace('.', '')
  })

  return (
    <GlassCard className="!bg-gold/[0.03] !border-gold/10">
      <div className="flex justify-between items-center mb-2">
        <div className="text-[10px] text-gold font-semibold uppercase tracking-[1.5px]">pH-trend</div>
        <div className="text-[10px] text-slate-500">{values.length} test</div>
      </div>
      <svg viewBox={`0 0 ${w} ${h + 14}`} className="w-full" style={{ height: 60 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8C97A" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#E8C97A" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Optimal zone */}
        <rect x="0" y={optTop} width={w} height={optBottom - optTop} fill="rgba(74,222,128,0.04)" rx="2" />
        <text x={w - 2} y={optTop - 1} fill="#475569" fontSize="5" textAnchor="end">7,6</text>
        <text x={w - 2} y={optBottom + 6} fill="#475569" fontSize="5" textAnchor="end">7,2</text>

        {/* Area fill */}
        <path d={areaPath} fill="url(#trendFill)" />

        {/* Data line */}
        <polyline
          points={polyline}
          fill="none"
          stroke="#E8C97A"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* End point with ring */}
        <circle cx={last.x} cy={last.y} r="4" fill="#0a1628" stroke="#E8C97A" strokeWidth="2" />

        {/* Day labels */}
        {labels.map((label, i) => (
          <text key={i} x={points[i].x} y={h + 10} fill="#475569" fontSize="5.5" textAnchor="middle">
            {i === labels.length - 1 ? 'Nu' : label}
          </text>
        ))}
      </svg>
    </GlassCard>
  )
}
