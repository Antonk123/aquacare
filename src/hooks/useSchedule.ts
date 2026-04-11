import { useMemo } from 'react'
import type { ScheduleState, SchedulePeriod } from '../types'
import { useLocalStorage } from './useLocalStorage'
import { STORAGE_KEYS, SCHEDULE_TASKS } from '../constants'

function getResetDate(period: SchedulePeriod): string {
  const now = new Date()
  switch (period) {
    case 'daily':
      return now.toISOString().split('T')[0]
    case 'weekly': {
      const day = now.getDay()
      const monday = new Date(now)
      monday.setDate(now.getDate() - ((day + 6) % 7))
      return monday.toISOString().split('T')[0]
    }
    case 'monthly':
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    case 'quarterly': {
      const quarter = Math.floor(now.getMonth() / 3)
      return `${now.getFullYear()}-${String(quarter * 3 + 1).padStart(2, '0')}-01`
    }
  }
}

function createEmptyState(): ScheduleState {
  const now = new Date().toISOString().split('T')[0]
  return {
    daily: {},
    weekly: {},
    monthly: {},
    quarterly: {},
    lastReset: { daily: now, weekly: now, monthly: now, quarterly: now },
  }
}

export function useSchedule() {
  const [state, setState] = useLocalStorage<ScheduleState>(STORAGE_KEYS.schedule, createEmptyState())

  const resetState = useMemo(() => {
    const periods: SchedulePeriod[] = ['daily', 'weekly', 'monthly', 'quarterly']
    let needsReset = false
    const updated = { ...state, lastReset: { ...state.lastReset } }

    for (const period of periods) {
      const resetDate = getResetDate(period)
      if (state.lastReset[period] !== resetDate) {
        updated[period] = {}
        updated.lastReset[period] = resetDate
        needsReset = true
      }
    }

    if (needsReset) {
      setState(updated)
      return updated
    }
    return state
  }, [state, setState])

  function toggleTask(period: SchedulePeriod, taskId: string) {
    setState((prev) => ({
      ...prev,
      [period]: { ...prev[period], [taskId]: !prev[period][taskId] },
    }))
  }

  function getProgress(period: SchedulePeriod) {
    const tasks = SCHEDULE_TASKS[period]
    const done = tasks.filter((t) => resetState[period][t.id]).length
    return { done, total: tasks.length, percent: tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0 }
  }

  return { state: resetState, toggleTask, getProgress }
}
