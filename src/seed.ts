import type { WaterLogEntry, Note } from './types'
import { STORAGE_KEYS } from './constants'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(18, 30, 0, 0)
  return d.toISOString()
}

const SEED_ENTRIES: WaterLogEntry[] = [
  { id: '1', date: daysAgo(0), ph: 7.4, freeChlorine: 4.0, totalAlkalinity: 95, waterTemp: 38 },
  { id: '2', date: daysAgo(1), ph: 7.3, freeChlorine: 3.5, totalAlkalinity: 75, waterTemp: 37 },
  { id: '3', date: daysAgo(3), ph: 7.6, freeChlorine: 5.2, totalAlkalinity: 110, waterTemp: 39 },
  { id: '4', date: daysAgo(5), ph: 7.1, freeChlorine: 2.8, totalAlkalinity: 100, bromine: 4.5, waterTemp: 38 },
  { id: '5', date: daysAgo(7), ph: 7.4, freeChlorine: 4.0, totalAlkalinity: 105, calciumHardness: 180, tds: 950, waterTemp: 37 },
]

const SEED_NOTES: Note[] = [
  { id: 'n1', title: 'Byt filterpatron', dueDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0], completed: false },
  { id: 'n2', title: 'Tömma & fylla på vatten', dueDate: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0], completed: false },
  { id: 'n3', title: 'Beställa pH+ pulver', dueDate: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0], completed: true, completedDate: new Date(Date.now() - 3 * 86400000).toISOString() },
]

export function seedIfEmpty() {
  if (!localStorage.getItem(STORAGE_KEYS.waterLog)) {
    localStorage.setItem(STORAGE_KEYS.waterLog, JSON.stringify(SEED_ENTRIES))
  }
  if (!localStorage.getItem(STORAGE_KEYS.notes)) {
    localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(SEED_NOTES))
  }
  if (!localStorage.getItem(STORAGE_KEYS.streak)) {
    localStorage.setItem(STORAGE_KEYS.streak, JSON.stringify({ currentStreak: 7, lastLogDate: new Date().toISOString().split('T')[0] }))
  }
}
