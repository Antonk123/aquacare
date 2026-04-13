import { useState, useEffect, useCallback } from 'react'
import type { WaterLogEntry, StreakData } from '../types'
import { api } from '../lib/api'

// API returns snake_case, frontend uses camelCase
function mapFromApi(row: any): WaterLogEntry {
  return {
    id: row.id,
    date: row.date,
    note: row.note ?? undefined,
    tubId: row.tub_id ?? undefined,
    tubName: row.tub_name ?? undefined,
    ph: row.ph ?? undefined,
    freeChlorine: row.free_chlorine ?? undefined,
    bromine: row.bromine ?? undefined,
    totalAlkalinity: row.total_alkalinity ?? undefined,
    calciumHardness: row.calcium_hardness ?? undefined,
    tds: row.tds ?? undefined,
    waterTemp: row.water_temp ?? undefined,
  }
}

export function useWaterLog() {
  const [entries, setEntries] = useState<WaterLogEntry[]>([])
  const [streak, setStreak] = useState<StreakData>({ currentStreak: 0, bestStreak: 0, lastLogDate: '' })

  useEffect(() => {
    api.listWaterLogs().then((rows) => setEntries(rows.map(mapFromApi))).catch(() => {})
    api.getStreak().then(setStreak).catch(() => {})
  }, [])

  const addEntry = useCallback(
    async (entry: Omit<WaterLogEntry, 'id'>) => {
      const row = await api.createWaterLog({
        tubId: entry.tubId,
        date: entry.date,
        note: entry.note,
        ph: entry.ph,
        freeChlorine: entry.freeChlorine,
        bromine: entry.bromine,
        totalAlkalinity: entry.totalAlkalinity,
        calciumHardness: entry.calciumHardness,
        tds: entry.tds,
        waterTemp: entry.waterTemp,
      })
      const mapped = mapFromApi(row)
      setEntries((prev) => [mapped, ...prev])
      // Refresh streak
      api.getStreak().then(setStreak).catch(() => {})
      return mapped
    },
    [],
  )

  const updateEntry = useCallback(
    async (id: string, patch: Partial<Omit<WaterLogEntry, 'id'>>) => {
      const row = await api.updateWaterLog(id, {
        tubId: patch.tubId,
        note: patch.note,
        ph: patch.ph,
        freeChlorine: patch.freeChlorine,
        bromine: patch.bromine,
        totalAlkalinity: patch.totalAlkalinity,
        calciumHardness: patch.calciumHardness,
        tds: patch.tds,
        waterTemp: patch.waterTemp,
      })
      const mapped = mapFromApi(row)
      setEntries((prev) => prev.map((e) => (e.id === id ? mapped : e)))
    },
    [],
  )

  const deleteEntry = useCallback(
    async (id: string) => {
      await api.deleteWaterLog(id)
      setEntries((prev) => prev.filter((e) => e.id !== id))
      api.getStreak().then(setStreak).catch(() => {})
    },
    [],
  )

  return { entries, streak, addEntry, updateEntry, deleteEntry }
}
