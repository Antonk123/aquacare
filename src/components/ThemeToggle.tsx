import { useState, useRef, useEffect } from 'react'
import { Moon, Sun, Palette } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import type { Palette as PaletteType } from '../hooks/useTheme'

interface ThemeToggleProps {
  className?: string
}

const PALETTES: { id: PaletteType; label: string; swatch: string; darkSwatch: string }[] = [
  { id: 'classic', label: 'Klassisk', swatch: '#f7f4ed', darkSwatch: '#1c1c1c' },
  { id: 'ocean', label: 'Ocean', swatch: '#3b82f6', darkSwatch: '#60a5fa' },
  { id: 'teal', label: 'Teal Spa', swatch: '#0f766e', darkSwatch: '#2dd4bf' },
  { id: 'midnight', label: 'Midnight', swatch: '#818cf8', darkSwatch: '#818cf8' },
  { id: 'emerald', label: 'Emerald', swatch: '#059669', darkSwatch: '#34d399' },
]

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme, palette, setPalette } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isDark = theme === 'dark'
  const isMidnight = palette === 'midnight'

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
        aria-label="Byt tema"
        className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-md bg-cream border border-cream-border text-charcoal hover:bg-charcoal-hover transition-colors"
      >
        <Palette size={16} strokeWidth={1.75} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[200px] bg-cream-light border border-cream-border rounded-xl p-3 shadow-focus-warm z-50 space-y-3">
          {/* Light/dark toggle */}
          {!isMidnight && (
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-[13px] text-charcoal hover:bg-charcoal-hover transition-colors"
            >
              {isDark ? <Sun size={15} strokeWidth={1.75} /> : <Moon size={15} strokeWidth={1.75} />}
              <span className="font-medium tracking-tight">
                {isDark ? 'Ljust läge' : 'Mörkt läge'}
              </span>
            </button>
          )}

          {!isMidnight && <div className="border-t border-cream-border" />}

          {/* Palette grid */}
          <div className="space-y-1">
            <div className="text-[10px] text-charcoal-muted uppercase tracking-[1.5px] font-medium px-2">
              Färgtema
            </div>
            {PALETTES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPalette(p.id)
                  setOpen(false)
                }}
                className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-[13px] transition-colors ${
                  palette === p.id
                    ? 'bg-charcoal-hover text-charcoal font-medium'
                    : 'text-charcoal-muted hover:bg-charcoal-hover hover:text-charcoal'
                }`}
              >
                <div className="flex gap-0.5">
                  <div
                    className="w-4 h-4 rounded-l-md border border-cream-border"
                    style={{ backgroundColor: p.swatch }}
                  />
                  <div
                    className="w-4 h-4 rounded-r-md border border-cream-border"
                    style={{ backgroundColor: p.darkSwatch }}
                  />
                </div>
                <span className="tracking-tight">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
