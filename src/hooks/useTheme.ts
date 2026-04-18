import { useEffect, useState, useCallback } from 'react'

export type Theme = 'light' | 'dark'
export type Palette = 'classic' | 'ocean' | 'teal' | 'midnight' | 'emerald'

const THEME_KEY = 'aquacare_theme'
const PALETTE_KEY = 'aquacare_palette'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // ignore
  }
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

const VALID_PALETTES: Palette[] = ['classic', 'ocean', 'teal', 'midnight', 'emerald']

function getInitialPalette(): Palette {
  if (typeof window === 'undefined') return 'classic'
  try {
    const stored = localStorage.getItem(PALETTE_KEY)
    if (stored && VALID_PALETTES.includes(stored as Palette)) return stored as Palette
  } catch {
    // ignore
  }
  return 'classic'
}

/** Theme-color meta values per palette×mode */
const META_COLORS: Record<Palette, { light: string; dark: string }> = {
  classic:  { light: '#f7f4ed', dark: '#171717' },
  ocean:    { light: '#f8fafc', dark: '#0c1222' },
  teal:     { light: '#f0fdfa', dark: '#0a1a1a' },
  midnight: { light: '#0f0f0f', dark: '#0f0f0f' },
  emerald:  { light: '#f0fdf4', dark: '#0a1a10' },
}

function applyTheme(theme: Theme, palette: Palette) {
  const root = document.documentElement
  // Midnight is always dark
  const effectiveTheme = palette === 'midnight' ? 'dark' : theme
  root.setAttribute('data-theme', effectiveTheme)
  root.setAttribute('data-palette', palette)

  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) {
    meta.content = META_COLORS[palette][effectiveTheme]
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  const [palette, setPaletteState] = useState<Palette>(getInitialPalette)

  useEffect(() => {
    applyTheme(theme, palette)
  }, [theme, palette])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    try { localStorage.setItem(THEME_KEY, next) } catch { /* ignore */ }
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem(THEME_KEY, next) } catch { /* ignore */ }
      return next
    })
  }, [])

  const setPalette = useCallback((next: Palette) => {
    setPaletteState(next)
    try { localStorage.setItem(PALETTE_KEY, next) } catch { /* ignore */ }
  }, [])

  return { theme, setTheme, toggleTheme, palette, setPalette }
}

export function initThemeBeforeMount() {
  if (typeof window === 'undefined') return
  const theme = getInitialTheme()
  const palette = getInitialPalette()
  applyTheme(theme, palette)
}
