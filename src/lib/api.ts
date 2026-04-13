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
}

export { ApiError }
