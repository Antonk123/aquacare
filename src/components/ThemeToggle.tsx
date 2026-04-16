import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

interface ThemeToggleProps {
  className?: string
}

/**
 * Small, inline light/dark toggle. Designed to sit in page headers next to
 * the page title — a 40x40 pill matching the other header-level controls.
 */
export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Byt till ljust läge' : 'Byt till mörkt läge'}
      title={isDark ? 'Ljust läge' : 'Mörkt läge'}
      className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-md bg-cream border border-cream-border text-charcoal hover:bg-charcoal-hover transition-colors ${className}`}
    >
      {isDark ? (
        <Sun size={16} strokeWidth={1.75} />
      ) : (
        <Moon size={16} strokeWidth={1.75} />
      )}
    </button>
  )
}
