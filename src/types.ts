export interface WaterLogEntry {
  id: string
  date: string
  ph?: number
  freeChlorine?: number
  bromine?: number
  totalAlkalinity?: number
  calciumHardness?: number
  tds?: number
  waterTemp?: number
}

export interface ScheduleState {
  daily: Record<string, boolean>
  weekly: Record<string, boolean>
  monthly: Record<string, boolean>
  quarterly: Record<string, boolean>
  lastReset: {
    daily: string
    weekly: string
    monthly: string
    quarterly: string
  }
}

export interface Note {
  id: string
  title: string
  dueDate: string
  completed: boolean
  completedDate?: string
}

export interface Settings {
  spaName: string
  waterVolume: number
}

export interface StreakData {
  currentStreak: number
  lastLogDate: string
}

export type SchedulePeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly'

export interface ScheduleTask {
  id: string
  name: string
  description: string
}

export interface OptimalRange {
  label: string
  min?: number
  max?: number
  unit: string
  key: keyof WaterLogEntry
}

export type CalculatorAction =
  | 'raise-ph'
  | 'lower-ph'
  | 'raise-alkalinity'
  | 'lower-alkalinity'
  | 'shock'
  | 'add-chlorine'

export interface CalculatorFormula {
  action: CalculatorAction
  label: string
  product: string
  unit: string
  dosagePerUnit: number
  changeStep: number
  instruction: string
}

export type ValueStatus = 'ok' | 'warn' | 'error'
