const API_BASE = '/api'

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('aquacare_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Okänt fel' }))
    throw new ApiError(res.status, body.error || 'Okänt fel')
  }

  return res.json()
}

export const api = {
  createFacility: (data: { facilityName: string; userName: string; pin: string }) =>
    request<{ token: string; user: { id: string; name: string; role: string }; facility: { id: string; name: string }; inviteCode: string }>(
      '/facilities', { method: 'POST', body: JSON.stringify(data) }
    ),
  joinFacility: (data: { inviteCode: string; userName: string; pin: string }) =>
    request<{ token: string; user: { id: string; name: string; role: string }; facility: { id: string; name: string } }>(
      '/facilities/join', { method: 'POST', body: JSON.stringify(data) }
    ),
  listFacilities: () =>
    request<{ id: string; name: string }[]>('/auth/facilities'),
  listFacilityUsers: (facilityId: string) =>
    request<{ id: string; name: string }[]>(`/auth/facilities/${facilityId}/users`),
  login: (data: { facilityId: string; userId: string; pin: string }) =>
    request<{ token: string; user: { id: string; name: string; role: string }; facility: { id: string; name: string } }>(
      '/auth/login', { method: 'POST', body: JSON.stringify(data) }
    ),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  me: () => request<{ user: { id: string; name: string; role: string }; facility: { id: string; name: string } }>('/auth/me'),
  listTubs: () =>
    request<{ id: string; name: string; volume: number; target_temp: number | null; sanitizer: string; created_at: string }[]>('/tubs'),
  createTub: (data: { name: string; volume: number; targetTemp?: number; sanitizer?: string }) =>
    request<{ id: string; name: string; volume: number; target_temp: number | null; sanitizer: string; created_at: string }>(
      '/tubs', { method: 'POST', body: JSON.stringify(data) }
    ),
  updateTub: (id: string, data: { name?: string; volume?: number; targetTemp?: number; sanitizer?: string }) =>
    request<{ id: string; name: string; volume: number; target_temp: number | null; sanitizer: string; created_at: string }>(
      `/tubs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }
    ),
  deleteTub: (id: string) => request<{ ok: boolean }>(`/tubs/${id}`, { method: 'DELETE' }),
  listUsers: () =>
    request<{ id: string; name: string; role: string; created_at: string }[]>('/users'),
  deleteUser: (id: string) => request<{ ok: boolean }>(`/users/${id}`, { method: 'DELETE' }),
  changeUserRole: (id: string, role: 'admin' | 'staff') =>
    request<{ ok: boolean }>(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  getInviteCode: () => request<{ inviteCode: string }>('/facilities/invite'),
  regenerateInviteCode: () => request<{ inviteCode: string }>('/facilities/invite', { method: 'POST' }),

  // Water Logs
  listWaterLogs: () =>
    request<any[]>('/water-logs'),
  createWaterLog: (data: { tubId?: string; date?: string; note?: string; ph?: number; freeChlorine?: number; bromine?: number; totalAlkalinity?: number; calciumHardness?: number; tds?: number; waterTemp?: number }) =>
    request<any>('/water-logs', { method: 'POST', body: JSON.stringify(data) }),
  updateWaterLog: (id: string, data: { tubId?: string; note?: string; ph?: number; freeChlorine?: number; bromine?: number; totalAlkalinity?: number; calciumHardness?: number; tds?: number; waterTemp?: number }) =>
    request<any>(`/water-logs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteWaterLog: (id: string) =>
    request<{ ok: boolean }>(`/water-logs/${id}`, { method: 'DELETE' }),

  // Notes
  listNotes: () =>
    request<any[]>('/notes'),
  createNote: (data: { title: string; dueDate: string }) =>
    request<any>('/notes', { method: 'POST', body: JSON.stringify(data) }),
  updateNote: (id: string, data: { completed?: boolean; title?: string }) =>
    request<any>(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteNote: (id: string) =>
    request<{ ok: boolean }>(`/notes/${id}`, { method: 'DELETE' }),

  // Schedule
  getSchedule: (period: string, tubId?: string) => {
    const qs = tubId ? `?tubId=${tubId}` : ''
    return request<{ periodKey: string; completions: { task_id: string; tub_id: string | null; completed_at: string; user_name: string }[] }>(`/schedule/${period}${qs}`)
  },
  toggleScheduleTask: (period: string, taskId: string, tubId?: string) =>
    request<{ completed: boolean }>(`/schedule/${period}/${taskId}`, { method: 'POST', body: JSON.stringify({ tubId }) }),

  // Streak
  getStreak: () =>
    request<{ currentStreak: number; bestStreak: number; lastLogDate: string }>('/auth/streak'),

  // Water Changes
  getLatestWaterChange: (tubId?: string) => {
    const qs = tubId ? `?tubId=${tubId}` : ''
    return request<{ changed_at: string; user_name: string; tub_name: string | null } | null>(`/water-changes/latest${qs}`)
  },
  markWaterChange: (tubId?: string) =>
    request<{ id: string; changed_at: string; user_name: string }>('/water-changes', { method: 'POST', body: JSON.stringify({ tubId }) }),

  // Reports
  getReport: (params?: { tubId?: string; userId?: string; from?: string; to?: string }) => {
    const qs = new URLSearchParams()
    if (params?.tubId) qs.set('tubId', params.tubId)
    if (params?.userId) qs.set('userId', params.userId)
    if (params?.from) qs.set('from', params.from)
    if (params?.to) qs.set('to', params.to)
    const query = qs.toString()
    return request<{
      logs: any[]
      summary: {
        totalLogs: number
        uniqueDays: number
        avgPh: number | null
        avgChlorine: number | null
        avgAlkalinity: number | null
        periodDays: number
        compliancePercent: number
      }
    }>(`/reports/water-logs${query ? '?' + query : ''}`)
  },
}

export { ApiError }
