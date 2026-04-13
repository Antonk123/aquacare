import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, LogOut, Users, Copy, RefreshCw, Shield, Trash2, Waves, Pencil, Plus, X, Check } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useSettings } from '../hooks/useSettings'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { formatSwedishDecimal } from '../constants'

type Tub = { id: string; name: string; volume: number; sanitizer: string }

const EMPTY_TUB_FORM = { name: '', volume: '1000', sanitizer: 'klor' }

export default function Settings() {
  const navigate = useNavigate()
  const { settings, updateSettings } = useSettings()
  const { user, facility, isAdmin, logout } = useAuth()
  const [spaName, setSpaName] = useState(settings.spaName)
  const [volume, setVolume] = useState(String(settings.waterVolume))
  const [cycleDays, setCycleDays] = useState(String(settings.waterChangeCycleDays))
  const [saved, setSaved] = useState(false)

  const [inviteCode, setInviteCode] = useState('')
  const [users, setUsers] = useState<{ id: string; name: string; role: string; created_at: string }[]>([])
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [codeCopied, setCodeCopied] = useState(false)

  // Tub management state
  const [tubs, setTubs] = useState<Tub[]>([])
  const [showTubForm, setShowTubForm] = useState(false)
  const [tubForm, setTubForm] = useState(EMPTY_TUB_FORM)
  const [editingTubId, setEditingTubId] = useState<string | null>(null)
  const [deleteTubId, setDeleteTubId] = useState<string | null>(null)
  const [tubSaving, setTubSaving] = useState(false)

  useEffect(() => {
    if (isAdmin) {
      api.getInviteCode().then((d) => setInviteCode(d.inviteCode)).catch(() => {})
      api.listUsers().then(setUsers).catch(() => {})
      api.listTubs().then((rows) =>
        setTubs(rows.map((t) => ({ id: t.id, name: t.name, volume: t.volume, sanitizer: t.sanitizer })))
      ).catch(() => {})
    }
  }, [isAdmin])

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const vol = Number(volume)
    const days = Number(cycleDays)
    if (!spaName.trim() || isNaN(vol) || vol <= 0 || isNaN(days) || days <= 0) return
    updateSettings({ spaName: spaName.trim(), waterVolume: vol, waterChangeCycleDays: days })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleLogout() {
    await logout()
    navigate('/valkom', { replace: true })
  }

  async function handleRegenerateCode() {
    const data = await api.regenerateInviteCode()
    setInviteCode(data.inviteCode)
  }

  function copyCode() {
    navigator.clipboard.writeText(inviteCode)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  async function handleDeleteUser(id: string) {
    await api.deleteUser(id)
    setUsers((prev) => prev.filter((u) => u.id !== id))
    setDeleteUserId(null)
  }

  async function handleToggleRole(id: string, currentRole: string) {
    const newRole = currentRole === 'admin' ? 'staff' : 'admin'
    await api.changeUserRole(id, newRole as 'admin' | 'staff')
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)))
  }

  function openAddTub() {
    setEditingTubId(null)
    setTubForm(EMPTY_TUB_FORM)
    setShowTubForm(true)
  }

  function openEditTub(tub: Tub) {
    setEditingTubId(tub.id)
    setTubForm({ name: tub.name, volume: String(tub.volume), sanitizer: tub.sanitizer })
    setShowTubForm(true)
  }

  function cancelTubForm() {
    setShowTubForm(false)
    setEditingTubId(null)
    setTubForm(EMPTY_TUB_FORM)
  }

  async function handleSaveTub(e: React.FormEvent) {
    e.preventDefault()
    const name = tubForm.name.trim()
    const volume = Number(tubForm.volume)
    if (!name || isNaN(volume) || volume <= 0) return
    setTubSaving(true)
    try {
      if (editingTubId) {
        const updated = await api.updateTub(editingTubId, { name, volume, sanitizer: tubForm.sanitizer })
        setTubs((prev) => prev.map((t) => t.id === editingTubId ? { id: updated.id, name: updated.name, volume: updated.volume, sanitizer: updated.sanitizer } : t))
      } else {
        const created = await api.createTub({ name, volume, sanitizer: tubForm.sanitizer })
        setTubs((prev) => [...prev, { id: created.id, name: created.name, volume: created.volume, sanitizer: created.sanitizer }])
      }
      cancelTubForm()
    } finally {
      setTubSaving(false)
    }
  }

  async function handleDeleteTub(id: string) {
    await api.deleteTub(id)
    setTubs((prev) => prev.filter((t) => t.id !== id))
    setDeleteTubId(null)
  }

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Tillbaka">
          <ArrowLeft size={20} className="text-slate-400" />
        </button>
        <h1 className="font-display text-xl text-gold font-bold">Inställningar</h1>
      </div>

      {/* User info */}
      <GlassCard>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-200">{user?.name}</div>
            <div className="text-xs text-slate-400">{facility?.name} — {user?.role === 'admin' ? 'Admin' : 'Personal'}</div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 min-h-[44px] px-3 text-red-400 text-sm font-medium">
            <LogOut size={16} />
            Logga ut
          </button>
        </div>
      </GlassCard>

      {/* Local settings */}
      <form onSubmit={handleSave} className="space-y-3">
        <div className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">Lokala inställningar</div>
        <GlassCard>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Spa-namn</label>
              <input type="text" value={spaName} onChange={(e) => setSpaName(e.target.value)} placeholder="MSpa Bristol Urban" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-colors duration-200" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Vattenvolym (liter)</label>
              <input type="text" inputMode="numeric" value={volume} onChange={(e) => setVolume(e.target.value)} placeholder="1000" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-colors duration-200" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Vattenbytescykel (dagar)</label>
              <input type="text" inputMode="numeric" value={cycleDays} onChange={(e) => setCycleDays(e.target.value)} placeholder="90" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-colors duration-200" />
              <span className="text-[11px] text-slate-500 mt-1 block">Nuvarande cykel: {formatSwedishDecimal(settings.waterChangeCycleDays)} dagar</span>
            </div>
          </div>
        </GlassCard>
        <button type="submit" className="flex items-center justify-center gap-2 w-full min-h-[48px] bg-gradient-to-br from-gold to-gold-dark text-navy rounded-[14px] font-bold text-[15px] tracking-wide shadow-[0_4px_16px_rgba(232,201,122,0.2)] transition-transform duration-200 active:scale-[0.98]">
          <Save size={18} strokeWidth={2.5} />
          {saved ? 'Sparat!' : 'Spara inställningar'}
        </button>
      </form>

      {/* Admin section */}
      {isAdmin && (
        <>
          <div className="text-[11px] text-slate-500 uppercase tracking-wider font-medium pt-2">Administration</div>
          <GlassCard>
            <div className="flex items-center gap-2 mb-2">
              <Users size={14} className="text-gold" />
              <span className="text-xs text-gold font-semibold uppercase tracking-wider">Inbjudningskod</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] flex items-center text-lg font-mono text-slate-200 tracking-[4px]">
                {inviteCode}
              </div>
              <button onClick={copyCode} className="min-w-[48px] min-h-[48px] flex items-center justify-center bg-white/5 border border-white/10 rounded-xl" aria-label="Kopiera">
                <Copy size={16} className={codeCopied ? 'text-status-ok' : 'text-slate-400'} />
              </button>
              <button onClick={handleRegenerateCode} className="min-w-[48px] min-h-[48px] flex items-center justify-center bg-white/5 border border-white/10 rounded-xl" aria-label="Generera ny kod">
                <RefreshCw size={16} className="text-slate-400" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Dela koden med personal som ska gå med i anläggningen.</p>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 mb-3">
              <Users size={14} className="text-gold" />
              <span className="text-xs text-gold font-semibold uppercase tracking-wider">Personal ({users.length})</span>
            </div>
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-1">
                  <div>
                    <span className="text-sm text-slate-200">{u.name}</span>
                    <span className="text-[10px] text-slate-500 ml-2">{u.role === 'admin' ? 'Admin' : 'Personal'}</span>
                  </div>
                  {u.id !== user?.id && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleToggleRole(u.id, u.role)} className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg" aria-label="Ändra roll">
                        <Shield size={14} className="text-slate-600" />
                      </button>
                      <button onClick={() => setDeleteUserId(u.id)} className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg" aria-label="Ta bort">
                        <Trash2 size={14} className="text-slate-600" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Tub management */}
          <GlassCard>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Waves size={14} className="text-gold" />
                <span className="text-xs text-gold font-semibold uppercase tracking-wider">Bad ({tubs.length})</span>
              </div>
              {!showTubForm && (
                <button
                  onClick={openAddTub}
                  className="flex items-center gap-1 min-h-[32px] px-2.5 bg-gold/10 border border-gold/20 text-gold rounded-lg text-[12px] font-semibold"
                >
                  <Plus size={12} strokeWidth={2.5} />
                  Lägg till bad
                </button>
              )}
            </div>

            {/* Tub list */}
            {tubs.length > 0 && !showTubForm && (
              <div className="space-y-2 mb-3">
                {tubs.map((tub) => (
                  <div key={tub.id} className="flex items-center justify-between py-1">
                    <div>
                      <span className="text-sm text-slate-200">{tub.name}</span>
                      <span className="text-[10px] text-slate-500 ml-2">{tub.volume} L · {tub.sanitizer === 'klor' ? 'Klor' : 'Brom'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditTub(tub)}
                        className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg"
                        aria-label="Redigera bad"
                      >
                        <Pencil size={14} className="text-slate-600" />
                      </button>
                      <button
                        onClick={() => setDeleteTubId(tub.id)}
                        className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg"
                        aria-label="Arkivera bad"
                      >
                        <Trash2 size={14} className="text-slate-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tubs.length === 0 && !showTubForm && (
              <p className="text-[11px] text-slate-500 mb-3">Inga bad tillagda ännu.</p>
            )}

            {/* Inline add/edit form */}
            {showTubForm && (
              <form onSubmit={handleSaveTub} className="space-y-3 mt-2">
                <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  {editingTubId ? 'Redigera bad' : 'Nytt bad'}
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Namn</label>
                  <input
                    type="text"
                    value={tubForm.name}
                    onChange={(e) => setTubForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="MSpa Bristol Urban"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-colors duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Volym (liter)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={tubForm.volume}
                    onChange={(e) => setTubForm((f) => ({ ...f, volume: e.target.value }))}
                    placeholder="1000"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-colors duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Desinfektionsmedel</label>
                  <select
                    value={tubForm.sanitizer}
                    onChange={(e) => setTubForm((f) => ({ ...f, sanitizer: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 focus:outline-none focus:border-gold/40 transition-colors duration-200 [color-scheme:dark]"
                  >
                    <option value="klor">Klor</option>
                    <option value="brom">Brom</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={tubSaving}
                    className="flex-1 flex items-center justify-center gap-1.5 min-h-[44px] bg-gradient-to-br from-gold to-gold-dark text-navy rounded-xl font-bold text-[13px] disabled:opacity-60"
                  >
                    <Check size={14} strokeWidth={2.5} />
                    {tubSaving ? 'Sparar…' : editingTubId ? 'Uppdatera' : 'Spara bad'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelTubForm}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/5 border border-white/10 rounded-xl"
                    aria-label="Avbryt"
                  >
                    <X size={16} className="text-slate-400" />
                  </button>
                </div>
              </form>
            )}
          </GlassCard>
        </>
      )}

      {deleteUserId && (
        <ConfirmDialog
          title="Ta bort användare"
          message="Vill du verkligen ta bort denna användare? Deras sessioner invalideras direkt."
          onConfirm={() => handleDeleteUser(deleteUserId)}
          onCancel={() => setDeleteUserId(null)}
        />
      )}

      {deleteTubId && (
        <ConfirmDialog
          title="Ta bort bad"
          message="Vill du verkligen ta bort detta bad? Befintliga loggningar påverkas inte."
          onConfirm={() => handleDeleteTub(deleteTubId)}
          onCancel={() => setDeleteTubId(null)}
        />
      )}
    </div>
  )
}
