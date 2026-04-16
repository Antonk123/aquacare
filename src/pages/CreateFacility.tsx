import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2 } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

const INPUT_CLS = 'w-full bg-cream-light border border-cream-border rounded-md px-3.5 min-h-[48px] text-base text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:shadow-focus-warm transition-shadow duration-200'
const LABEL_CLS = 'block text-[12px] text-charcoal-muted mb-1.5 font-medium tracking-tight'

export default function CreateFacility() {
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const [facilityName, setFacilityName] = useState('')
  const [userName, setUserName] = useState('')
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!facilityName.trim() || !userName.trim()) { setError('Alla fält krävs.'); return }
    if (!/^\d{4}$/.test(pin)) { setError('PIN måste vara 4 siffror.'); return }
    if (pin !== pinConfirm) { setError('PIN-koderna matchar inte.'); return }

    setLoading(true)
    try {
      const data = await api.createFacility({ facilityName: facilityName.trim(), userName: userName.trim(), pin })
      setSession(data.token, data.user, data.facility)
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Något gick fel.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-5 min-h-dvh safe-area-pt">
      <div className="max-w-sm mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/valkom')} className="min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Tillbaka">
            <ArrowLeft size={20} className="text-charcoal-muted" />
          </button>
          <h1 className="font-display text-xl text-charcoal font-bold">Skapa anläggning</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <GlassCard>
            <div className="space-y-3">
              <div>
                <label className={LABEL_CLS}>Anläggningsnamn</label>
                <input type="text" value={facilityName} onChange={(e) => setFacilityName(e.target.value)} placeholder="T.ex. Strandbadet Spa" className={INPUT_CLS} autoFocus />
              </div>
              <div>
                <label className={LABEL_CLS}>Ditt namn</label>
                <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="T.ex. Anna K" className={INPUT_CLS} />
              </div>
              <div>
                <label className={LABEL_CLS}>Välj PIN-kod (4 siffror)</label>
                <input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="••••" className={`${INPUT_CLS} text-center tracking-[8px] placeholder:tracking-[4px]`} />
              </div>
              <div>
                <label className={LABEL_CLS}>Bekräfta PIN-kod</label>
                <input type="password" inputMode="numeric" maxLength={4} value={pinConfirm} onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="••••" className={`${INPUT_CLS} text-center tracking-[8px] placeholder:tracking-[4px]`} />
              </div>
            </div>
          </GlassCard>
          {error && <p className="text-sm text-status-error text-center">{error}</p>}
          <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 w-full min-h-[48px] bg-charcoal text-cream-light shadow-inset-btn rounded-[14px] font-bold text-[15px] tracking-wide transition-transform duration-200 active:scale-[0.98] disabled:opacity-50">
            <Building2 size={18} strokeWidth={2.5} />
            {loading ? 'Skapar...' : 'Skapa anläggning'}
          </button>
        </form>
      </div>
    </div>
  )
}
