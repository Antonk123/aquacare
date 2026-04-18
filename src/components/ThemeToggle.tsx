import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../hooks/useTheme'
import type { Mood } from '../hooks/useTheme'
import { MOOD_META } from '../hooks/useTheme'
import { Check } from 'lucide-react'

interface ThemeToggleProps {
  className?: string
}

const MOOD_GRADIENTS: Record<Mood, string> = {
  hammam: 'radial-gradient(ellipse at 30% 20%, oklch(0.80 0.06 215) 0%, oklch(0.55 0.08 225) 60%, oklch(0.35 0.06 235) 100%)',
  terme: 'radial-gradient(ellipse at 30% 20%, oklch(0.65 0.09 225) 0%, oklch(0.40 0.10 235) 55%, oklch(0.25 0.08 245) 100%)',
  onsen: 'radial-gradient(ellipse at 30% 20%, oklch(0.55 0.08 210) 0%, oklch(0.35 0.07 225) 55%, oklch(0.18 0.05 240) 100%)',
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { mood, setMood } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Byt atmosfär"
        className="w-[34px] h-[34px] flex items-center justify-center rounded-full bg-cream-light border border-cream-border text-charcoal transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 2v3M12 19v3M4.2 4.2l2.2 2.2M17.6 17.6l2.2 2.2M2 12h3M19 12h3M4.2 19.8l2.2-2.2M17.6 6.4l2.2-2.2"/>
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[240px] bg-cream-light border border-cream-border rounded-[20px] p-3 shadow-focus z-50">
          <div className="spa-label px-2 mb-2">Atmosfär</div>
          <div className="space-y-1">
            {(Object.keys(MOOD_META) as Mood[]).map((key) => {
              const m = MOOD_META[key]
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setMood(key)
                    setOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-xl text-left transition-colors ${
                    mood === key ? 'bg-charcoal-hover' : 'hover:bg-charcoal-hover'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0"
                    style={{
                      background: MOOD_GRADIENTS[key],
                      boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.1)',
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-[15px] text-charcoal tracking-tight">
                      {m.name}
                    </div>
                    <div className="text-[11px] text-charcoal-muted tracking-tight">
                      {m.subtitle}
                    </div>
                  </div>
                  {mood === key && (
                    <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-cream" strokeWidth={2.5} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
