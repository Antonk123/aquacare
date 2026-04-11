import { useCallback } from 'react'
import type { WaterLogEntry, StreakData } from '../types'
import { useLocalStorage } from './useLocalStorage'
import { STORAGE_KEYS } from '../constants'

export function useWaterLog() {
  const [entries, setEntries] = useLocalStorage<WaterLogEntry[]>(STORAGE_KEYS.waterLog, [])
  const [streak, setStreak] = useLocalStorage<StreakData>(STORAGE_KEYS.streak, {
    currentStreak: 0,
    lastLogDate: '',
  })

  const addEntry = useCallback(
    (entry: Omit<WaterLogEntry, 'id'>) => {
      const newEntry: WaterLogEntry = { ...entry, id: crypto.randomUUID() }
      setEntries((prev) => [newEntry, ...prev])

      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

      setStreak((prev) => {
        if (prev.lastLogDate === today) return prev
        const newStreak = prev.lastLogDate === yesterday ? prev.currentStreak + 1 : 1
        return { currentStreak: newStreak, lastLogDate: today }
      })

      return newEntry
    },
    [setEntries, setStreak],
  )

  const deleteEntry = useCallback(
    (id: string) => {
      setEntries((prev) => prev.filter((e) => e.id !== id))
    },
    [setEntries],
  )

  return { entries, streak, addEntry, deleteEntry }
}
