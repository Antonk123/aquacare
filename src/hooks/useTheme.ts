import { useEffect, useState, useCallback } from 'react'

export type Mood = 'hammam' | 'terme' | 'onsen'

// Legacy exports for compatibility
export type Theme = 'light' | 'dark'
export type Palette = Mood

const MOOD_KEY = 'aquacare_mood'

const VALID_MOODS: Mood[] = ['hammam', 'terme', 'onsen']

export const MOOD_META: Record<Mood, { name: string; subtitle: string; metaColor: string }> = {
  hammam: { name: 'Hammam', subtitle: 'Mineral, imma, eucalyptus', metaColor: '#e8ecf0' },
  terme: { name: 'Terme', subtitle: 'Sand, terrakotta, djupvatten', metaColor: '#ede5d4' },
  onsen: { name: 'Onsen', subtitle: 'Teak, djupvatten, guld', metaColor: '#1a1610' },
}

function getInitialMood(): Mood {
  if (typeof window === 'undefined') return 'hammam'
  try {
    const stored = localStorage.getItem(MOOD_KEY)
    if (stored && VALID_MOODS.includes(stored as Mood)) return stored as Mood
  } catch {
    // ignore
  }
  return 'hammam'
}

function applyMood(mood: Mood) {
  const root = document.documentElement
  root.setAttribute('data-mood', mood)

  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) {
    meta.content = MOOD_META[mood].metaColor
  }
}

export function useTheme() {
  const [mood, setMoodState] = useState<Mood>(getInitialMood)

  useEffect(() => {
    applyMood(mood)
  }, [mood])

  const setMood = useCallback((next: Mood) => {
    setMoodState(next)
    try { localStorage.setItem(MOOD_KEY, next) } catch { /* ignore */ }
  }, [])

  // Derived theme for components that check light/dark
  const theme: Theme = mood === 'onsen' ? 'dark' : 'light'
  const isDark = mood === 'onsen'

  // Legacy compatibility
  const palette = mood
  const setPalette = setMood as (p: Palette) => void
  const setTheme = useCallback(() => {}, [])
  const toggleTheme = useCallback(() => {
    // Cycle through moods instead
    setMoodState(prev => {
      const idx = VALID_MOODS.indexOf(prev)
      const next = VALID_MOODS[(idx + 1) % VALID_MOODS.length]
      try { localStorage.setItem(MOOD_KEY, next) } catch { /* ignore */ }
      return next
    })
  }, [])

  return { theme, setTheme, toggleTheme, palette, setPalette, mood, setMood, isDark }
}

export function initThemeBeforeMount() {
  if (typeof window === 'undefined') return
  const mood = getInitialMood()
  applyMood(mood)
}
