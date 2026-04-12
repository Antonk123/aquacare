import type {
  ScheduleTask,
  SchedulePeriod,
  OptimalRange,
  CalculatorFormula,
  ValueStatus,
} from './types'

export const DEFAULT_SETTINGS = {
  spaName: 'MSpa Bristol Urban',
  waterVolume: 1000,
} as const

export const OPTIMAL_RANGES: OptimalRange[] = [
  { label: 'pH', min: 7.2, max: 7.6, unit: '', key: 'ph' },
  { label: 'Fritt klor', min: 3, max: 5, unit: 'mg/L', key: 'freeChlorine' },
  { label: 'Brom', min: 4, max: 6, unit: 'mg/L', key: 'bromine' },
  { label: 'Alkalinitet', min: 80, max: 120, unit: 'mg/L', key: 'totalAlkalinity' },
  { label: 'Kalcium', min: 150, max: 250, unit: 'mg/L', key: 'calciumHardness' },
  { label: 'TDS', max: 1500, unit: 'mg/L', key: 'tds' },
  { label: 'Temperatur', max: 40, unit: '°C', key: 'waterTemp' },
]

export function getValueStatus(range: OptimalRange, value: number): ValueStatus {
  const { min, max } = range
  if (min !== undefined && value < min) return value < min * 0.9 ? 'error' : 'warn'
  if (max !== undefined && value > max) return value > max * 1.1 ? 'error' : 'warn'
  return 'ok'
}

export function formatSwedishDecimal(value: number): string {
  return value.toString().replace('.', ',')
}

export const SCHEDULE_TASKS: Record<SchedulePeriod, ScheduleTask[]> = {
  daily: [
    { id: 'd1', name: 'Kontrollera vattentemperatur', description: 'Se till att temp är under 40°C' },
    { id: 'd2', name: 'Testa pH & klor', description: 'Använd teststickor, logga resultaten' },
    { id: 'd3', name: 'Ta bort skräp & kontrollera filter', description: 'Skumma ytan, skölj filtret vid behov' },
  ],
  weekly: [
    { id: 'w1', name: 'Chocka vattnet', description: 'Använd klorchock enligt dosering' },
    { id: 'w2', name: 'Rengör filtret ordentligt', description: 'Ta ur och skölj under rinnande vatten' },
    { id: 'w3', name: 'Kontrollera alkalinitet', description: 'Testa och justera vid behov' },
    { id: 'w4', name: 'Torka av spats yta', description: 'Rengör kanten och locket med fuktig trasa' },
  ],
  monthly: [
    { id: 'm1', name: 'Testa kalciumhårdhet & TDS', description: 'Använd teststickor eller digitalt' },
    { id: 'm2', name: 'Djuprengör filtret', description: 'Blötlägg i filterrengöring över natten' },
    { id: 'm3', name: 'Inspektera spalock & clips', description: 'Kontrollera barnsäkring och isolering' },
    { id: 'm4', name: 'Kontrollera UVC-lampa', description: 'Verifiera att UVC-indikatorn lyser' },
  ],
  quarterly: [
    { id: 'q1', name: 'Töm & fyll på helt nytt vatten', description: 'Använd dräneringsventilen, fyll med rent vatten' },
    { id: 'q2', name: 'Rengör rör med spolmedel', description: 'Kör spolmedel genom systemet före tömning' },
    { id: 'q3', name: 'Kontrollera anslutningar & slangar', description: 'Leta efter läckor och slitage' },
  ],
}

export const PERIOD_LABELS: Record<SchedulePeriod, string> = {
  daily: 'Dagligen',
  weekly: 'Veckovis',
  monthly: 'Månadsvis',
  quarterly: '3 mån',
}

export const CALCULATOR_FORMULAS: CalculatorFormula[] = [
  {
    action: 'raise-ph',
    label: 'Höja pH',
    product: 'Natriumkarbonat (pH+)',
    unit: 'g',
    dosagePerUnit: 10,
    changeStep: 0.1,
    instruction: 'Tillsätt gradvis med jetsen igång. Testa igen efter 2 timmar.',
  },
  {
    action: 'lower-ph',
    label: 'Sänka pH',
    product: 'Natriumbisulfat (pH−)',
    unit: 'g',
    dosagePerUnit: 10,
    changeStep: 0.1,
    instruction: 'Tillsätt gradvis med jetsen igång. Testa igen efter 2 timmar.',
  },
  {
    action: 'raise-alkalinity',
    label: 'Höja alkalinitet',
    product: 'Natriumbikarbonat',
    unit: 'g',
    dosagePerUnit: 15,
    changeStep: 10,
    instruction: 'Lös upp i en hink vatten först. Tillsätt med pumpen igång.',
  },
  {
    action: 'lower-alkalinity',
    label: 'Sänka alkalinitet',
    product: 'Natriumbisulfat',
    unit: 'g',
    dosagePerUnit: 12,
    changeStep: 10,
    instruction: 'Tillsätt gradvis. Testa alkalinitet och pH efter 4 timmar.',
  },
  {
    action: 'shock',
    label: 'Chockbehandling',
    product: 'Klorchock',
    unit: 'g',
    dosagePerUnit: 20,
    changeStep: 1,
    instruction: 'Tillsätt med locket öppet. Bada inte förrän klornivån sjunkit till under 5 mg/L.',
  },
  {
    action: 'add-chlorine',
    label: 'Tillsätt klor',
    product: 'Diklorgranuler',
    unit: 'g',
    dosagePerUnit: 2,
    changeStep: 1,
    instruction: 'Lös upp i vatten först. Tillsätt med pumpen igång.',
  },
]

export const TEST_STRIP_COLORS = {
  freeChlorine: {
    label: 'Fritt klor',
    unit: 'ppm',
    key: 'freeChlorine' as const,
    values: [
      { value: 0, color: '#F5F0E0' },
      { value: 0.5, color: '#F5E0D0' },
      { value: 1, color: '#F0C4B0' },
      { value: 2, color: '#E8A0A0' },
      { value: 3, color: '#D07080' },
      { value: 5, color: '#C05070' },
      { value: 10, color: '#A03060' },
    ],
  },
  ph: {
    label: 'pH',
    unit: '',
    key: 'ph' as const,
    values: [
      { value: 6.2, color: '#D4A030' },
      { value: 6.8, color: '#D07040' },
      { value: 7.2, color: '#C86050' },
      { value: 7.8, color: '#C04060' },
      { value: 8.4, color: '#A03058' },
    ],
  },
  totalAlkalinity: {
    label: 'Alkalinitet',
    unit: 'ppm',
    key: 'totalAlkalinity' as const,
    values: [
      { value: 0, color: '#D4A030' },
      { value: 40, color: '#B8963C' },
      { value: 80, color: '#8C7428' },
      { value: 120, color: '#6B5820' },
      { value: 180, color: '#4A5C28' },
      { value: 240, color: '#2E4420' },
    ],
  },
} as const

export const TEST_STRIP_STEPS = [
  TEST_STRIP_COLORS.freeChlorine,
  TEST_STRIP_COLORS.ph,
  TEST_STRIP_COLORS.totalAlkalinity,
] as const

export const WATER_CHANGE_CYCLE_DAYS = 90

export const STORAGE_KEYS = {
  waterLog: 'aquacare_water_log',
  schedule: 'aquacare_schedule',
  notes: 'aquacare_notes',
  settings: 'aquacare_settings',
  streak: 'aquacare_streak',
  waterChange: 'aquacare_water_change',
} as const
