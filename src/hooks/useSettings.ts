import type { Settings } from '../types'
import { useLocalStorage } from './useLocalStorage'
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../constants'

export function useSettings() {
  const [settings, setSettings] = useLocalStorage<Settings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS)

  function updateSettings(patch: Partial<Settings>) {
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  return { settings, updateSettings }
}
