import { useState, useEffect } from 'react'

interface WaterSurfaceProps {
  temp?: number
  status: 'ok' | 'warn' | 'alarm'
}

function fmt(v: number | undefined, decimals = 1): string {
  if (v == null) return '—'
  return v.toFixed(decimals).replace('.', ',')
}

export function WaterSurface({ temp, status }: WaterSurfaceProps) {
  const [t, setT] = useState(0)

  useEffect(() => {
    let raf: number
    const start = performance.now()
    const loop = (now: number) => {
      setT((now - start) / 1000)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const W = 360
  const H = 180

  const wavePath = (amp: number, freq: number, phase: number, yOffset: number) => {
    const pts: string[] = []
    for (let x = 0; x <= W; x += 6) {
      const y = yOffset + Math.sin((x / W) * Math.PI * freq + phase + t) * amp
      pts.push(`${x},${y.toFixed(2)}`)
    }
    return `M0,${H} L${pts.join(' L')} L${W},${H} Z`
  }

  const statusLabel = status === 'ok' ? 'I balans' : status === 'warn' ? 'Nära gräns' : 'Behöver omsorg'

  return (
    <div
      className="relative w-full overflow-hidden rounded-[24px]"
      style={{
        height: 180,
        background: 'radial-gradient(ellipse at 30% 20%, var(--color-water) 0%, var(--color-accent) 60%, oklch(0.35 0.06 235) 100%)',
        boxShadow: 'inset 0 0 0 1px var(--color-cream-border), 0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="absolute inset-0"
      >
        <defs>
          <linearGradient id="w1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.22"/>
            <stop offset="1" stopColor="#fff" stopOpacity="0.02"/>
          </linearGradient>
          <linearGradient id="w2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.14"/>
            <stop offset="1" stopColor="#fff" stopOpacity="0.01"/>
          </linearGradient>
        </defs>
        <path d={wavePath(3, 6, 0, 60)} fill="url(#w1)" />
        <path d={wavePath(4, 4, 1.5, 90)} fill="url(#w2)" />
        <path d={wavePath(2.5, 8, 3, 120)} fill="url(#w2)" />
        {/* Steam dots */}
        {[0.2, 0.5, 0.8].map((x, i) => (
          <circle
            key={i}
            cx={x * W + Math.sin(t * 0.7 + i) * 8}
            cy={30 + Math.sin(t * 0.5 + i * 1.3) * 6}
            r={8 + Math.sin(t + i) * 2}
            fill="#fff"
            opacity={0.08}
          />
        ))}
      </svg>

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
        <div className="flex justify-between items-start">
          <div className="spa-label !text-white/75 !text-[10px]" style={{ letterSpacing: '0.15em' }}>
            Vattenyta · levande
          </div>
          <div
            className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-body"
            style={{
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(8px)',
              border: '0.5px solid rgba(255,255,255,0.3)',
              fontWeight: 500,
            }}
          >
            {statusLabel}
          </div>
        </div>
        <div>
          <div className="spa-value text-[64px] leading-none" style={{ fontWeight: 300, letterSpacing: '-0.04em' }}>
            {fmt(temp, 1)}
            <span className="text-[24px] opacity-70 ml-0.5">°C</span>
          </div>
          <div className="font-body text-[12px] opacity-70 mt-1" style={{ letterSpacing: '-0.01em' }}>
            målvärde 38,0°C · stabil senaste 4h
          </div>
        </div>
      </div>
    </div>
  )
}
