import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api'

interface AuthUser {
  id: string
  name: string
  role: string
}

interface AuthFacility {
  id: string
  name: string
}

interface AuthContextValue {
  user: AuthUser | null
  facility: AuthFacility | null
  token: string | null
  isAdmin: boolean
  loading: boolean
  setSession: (token: string, user: AuthUser, facility: AuthFacility) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [facility, setFacility] = useState<AuthFacility | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('aquacare_token'))
  const [loading, setLoading] = useState(!!localStorage.getItem('aquacare_token'))

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    api.me()
      .then((data) => {
        setUser(data.user)
        setFacility(data.facility)
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          localStorage.removeItem('aquacare_token')
          setToken(null)
        }
      })
      .finally(() => setLoading(false))
  }, [token])

  const setSession = useCallback((newToken: string, newUser: AuthUser, newFacility: AuthFacility) => {
    localStorage.setItem('aquacare_token', newToken)
    setToken(newToken)
    setUser(newUser)
    setFacility(newFacility)
  }, [])

  const logout = useCallback(async () => {
    try { await api.logout() } catch { /* ignore */ }
    localStorage.removeItem('aquacare_token')
    setToken(null)
    setUser(null)
    setFacility(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, facility, token, isAdmin: user?.role === 'admin', loading, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !token) {
      navigate('/valkom', { replace: true })
    }
  }, [loading, token, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!token) return null
  return <>{children}</>
}
