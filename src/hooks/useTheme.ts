import { useEffect, useState, useCallback } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'aquacare_theme'

/**
 * Reads the initial theme from localStorage, falling back to the user's
 * OS preference. Safe to call during SSR (returns 'light' if window missing).
 */
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // ignore access errors (private mode, etc.)
  }
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

/**
 * Applies the theme to <html> via data-theme attribute and updates the
 * browser chrome (theme-color meta) so status bars match.
 */
function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)

  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) {
    meta.content = theme === 'dark' ? '#171717' : '#f7f4ed'
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)

  // Apply once on mount (covers the case where the initial SSR value
  // differed from the client-side preference).
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  return { theme, setTheme, toggleTheme }
}

/**
 * Applies the persisted theme as early as possible, before React mounts,
 * to avoid a flash of light-mode content. Call this once from main.tsx.
 */
export function initThemeBeforeMount() {
  if (typeof window === 'undefined') return
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') {
      applyTheme(stored)
      return
    }
  } catch {
    // ignore
  }
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  applyTheme(prefersDark ? 'dark' : 'light')
}
