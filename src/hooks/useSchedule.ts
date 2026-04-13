import { useState, useEffect, useCallback } from 'react'
import type { ScheduleState, SchedulePeriod } from '../types'
import { SCHEDULE_TASKS } from '../constants'
import { api } from '../lib/api'

const PERIODS: SchedulePeriod[] = ['daily', 'weekly', 'monthly', 'quarterly']

function createEmptyState(): ScheduleState {
  return {
    daily: {},
    weekly: {},
    monthly: {},
    quarterly: {},
    lastReset: { daily: '', weekly: '', monthly: '', quarterly: '' },
  }
}

export function useSchedule() {
  const [state, setState] = useState<ScheduleState>(createEmptyState)

  useEffect(() => {
    async function loadAll() {
      const newState = createEmptyState()
      for (const period of PERIODS) {
        try {
          const { periodKey, completions } = await api.getSchedule(period)
          newState.lastReset[period] = periodKey
          for (const c of completions) {
            newState[period][c.task_id] = true
          }
        } catch { /* ignore */ }
      }
      setState(newState)
    }
    loadAll()
  }, [])

  const toggleTask = useCallback(
    async (period: SchedulePeriod, taskId: string) => {
      // Optimistic update
      setState((prev) => ({
        ...prev,
        [period]: { ...prev[period], [taskId]: !prev[period][taskId] },
      }))
      try {
        await api.toggleScheduleTask(period, taskId)
      } catch {
        // Revert on error
        setState((prev) => ({
          ...prev,
          [period]: { ...prev[period], [taskId]: !prev[period][taskId] },
        }))
      }
    },
    [],
  )

  const getProgress = useCallback(
    (period: SchedulePeriod) => {
      const tasks = SCHEDULE_TASKS[period]
      const done = tasks.filter((t) => state[period][t.id]).length
      return { done, total: tasks.length, percent: tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0 }
    },
    [state],
  )

  return { state, toggleTask, getProgress }
}
