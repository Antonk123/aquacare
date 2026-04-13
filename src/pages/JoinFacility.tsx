import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, KeyRound } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

export default function JoinFacility() {
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const [inviteCode, setInviteCode] = useState('')
  const [userName, setUserName] = useState('')
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!inviteCode.trim() || !userName.trim()) { setError('Alla fält krävs.'); return }
    if (!/^\d{4}$/.test(pin)) { setError('PIN måste vara 4 siffror.'); return }
    if (pin !== pinConfirm) { setError('PIN-koderna matchar inte.'); return }

    setLoading(true)
    try {
      const data = await api.joinFacility({ inviteCode: inviteCode.trim(), userName: userName.trim(), pin })
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
            <ArrowLeft size={20} className="text-slate-400" />
          </button>
          <h1 className="font-display text-xl text-gold font-bold">Gå med</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <GlassCard>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Inbjudningskod</label>
                <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} placeholder="T.ex. A3F1B2" maxLength={6} className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 text-center tracking-[6px] uppercase placeholder:tracking-[2px] placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-colors duration-200" autoFocus />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Ditt namn</label>
                <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="T.ex. Erik S" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-colors duration-200" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Välj PIN-kod (4 siffror)</label>
                <input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="••••" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 text-center tracking-[8px] placeholder:tracking-[4px] placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-colors duration-200" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Bekräfta PIN-kod</label>
                <input type="password" inputMode="numeric" maxLength={4} value={pinConfirm} onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="••••" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 text-center tracking-[8px] placeholder:tracking-[4px] placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-colors duration-200" />
              </div>
            </div>
          </GlassCard>
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 w-full min-h-[48px] bg-gradient-to-br from-gold to-gold-dark text-navy rounded-[14px] font-bold text-[15px] tracking-wide shadow-[0_4px_16px_rgba(232,201,122,0.2)] transition-transform duration-200 active:scale-[0.98] disabled:opacity-50">
            <KeyRound size={18} strokeWidth={2.5} />
            {loading ? 'Ansluter...' : 'Gå med'}
          </button>
        </form>
      </div>
    </div>
  )
}
