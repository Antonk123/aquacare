import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, LogIn, ChevronRight } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

const INPUT_CLS = 'w-full bg-cream-light border border-cream-border rounded-md px-3.5 min-h-[48px] text-base text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:shadow-focus-warm transition-shadow duration-200'
const LABEL_CLS = 'block text-[12px] text-charcoal-muted mb-1.5 font-medium tracking-tight'

type Step = 'facility' | 'user' | 'pin'

export default function Login() {
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const [step, setStep] = useState<Step>('facility')
  const [facilities, setFacilities] = useState<{ id: string; name: string }[]>([])
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [selectedFacility, setSelectedFacility] = useState<{ id: string; name: string } | null>(null)
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { api.listFacilities().then(setFacilities).catch(() => {}) }, [])

  function selectFacility(f: { id: string; name: string }) {
    setSelectedFacility(f); setStep('user'); setError('')
    api.listFacilityUsers(f.id).then(setUsers).catch(() => {})
  }

  function selectUser(u: { id: string; name: string }) {
    setSelectedUser(u); setStep('pin'); setError(''); setPin('')
  }

  function goBack() {
    if (step === 'pin') { setStep('user'); setPin(''); setError('') }
    else if (step === 'user') { setStep('facility'); setError('') }
    else navigate('/valkom')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFacility || !selectedUser) return
    setError('')
    if (!/^\d{4}$/.test(pin)) { setError('PIN måste vara 4 siffror.'); return }

    setLoading(true)
    try {
      const data = await api.login({ facilityId: selectedFacility.id, userId: selectedUser.id, pin })
      setSession(data.token, data.user, data.facility)
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Felaktig PIN.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-5 min-h-dvh safe-area-pt">
      <div className="max-w-sm mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Tillbaka">
            <ArrowLeft size={20} className="text-charcoal-muted" />
          </button>
          <h1 className="font-display text-xl text-charcoal font-bold">
            {step === 'facility' ? 'Välj anläggning' : step === 'user' ? 'Välj ditt namn' : 'Ange PIN'}
          </h1>
        </div>

        {step === 'facility' && (
          <div className="space-y-2">
            {facilities.length === 0 ? (
              <GlassCard className="text-center py-6"><p className="text-sm text-charcoal-muted">Inga anläggningar hittades</p></GlassCard>
            ) : facilities.map((f) => (
              <button key={f.id} onClick={() => selectFacility(f)} className="w-full text-left">
                <GlassCard className="flex items-center justify-between active:scale-[0.98] transition-transform duration-200">
                  <span className="text-sm font-semibold text-charcoal">{f.name}</span>
                  <ChevronRight size={16} className="text-charcoal-muted" />
                </GlassCard>
              </button>
            ))}
          </div>
        )}

        {step === 'user' && (
          <div className="space-y-2">
            <p className="text-xs text-charcoal-muted">{selectedFacility?.name}</p>
            {users.length === 0 ? (
              <GlassCard className="text-center py-6"><p className="text-sm text-charcoal-muted">Inga användare hittades</p></GlassCard>
            ) : users.map((u) => (
              <button key={u.id} onClick={() => selectUser(u)} className="w-full text-left">
                <GlassCard className="flex items-center justify-between active:scale-[0.98] transition-transform duration-200">
                  <span className="text-sm font-semibold text-charcoal">{u.name}</span>
                  <ChevronRight size={16} className="text-charcoal-muted" />
                </GlassCard>
              </button>
            ))}
          </div>
        )}

        {step === 'pin' && (
          <form onSubmit={handleLogin} className="space-y-3">
            <p className="text-xs text-charcoal-muted">{selectedFacility?.name} — {selectedUser?.name}</p>
            <GlassCard>
              <label className={LABEL_CLS}>PIN-kod</label>
              <input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="••••" className={`${INPUT_CLS} text-center tracking-[8px] placeholder:tracking-[4px]`} autoFocus />
            </GlassCard>
            {error && <p className="text-sm text-status-error text-center">{error}</p>}
            <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 w-full min-h-[48px] bg-charcoal text-cream-light shadow-inset-btn rounded-[14px] font-bold text-[15px] tracking-wide transition-transform duration-200 active:scale-[0.98] disabled:opacity-50">
              <LogIn size={18} strokeWidth={2.5} />
              {loading ? 'Loggar in...' : 'Logga in'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
