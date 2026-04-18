import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, RefreshCw, Trash2, Pencil, X, Check } from 'lucide-react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useSettings } from '../hooks/useSettings'
import { useAuth } from '../contexts/AuthContext'
import { useTheme, MOOD_META } from '../hooks/useTheme'
import type { Mood } from '../hooks/useTheme'
import { api } from '../lib/api'
import { formatSwedishDecimal, OPTIMAL_RANGES } from '../constants'

type Tub = { id: string; name: string; volume: number; sanitizer: string; custom_ranges: string | null }

const MOOD_GRADIENTS: Record<Mood, string> = {
  hammam: 'radial-gradient(ellipse at 30% 20%, oklch(0.80 0.06 215) 0%, oklch(0.55 0.08 225) 60%, oklch(0.35 0.06 235) 100%)',
  terme: 'radial-gradient(ellipse at 30% 20%, oklch(0.65 0.09 225) 0%, oklch(0.40 0.10 235) 55%, oklch(0.25 0.08 245) 100%)',
  onsen: 'radial-gradient(ellipse at 30% 20%, oklch(0.55 0.08 210) 0%, oklch(0.35 0.07 225) 55%, oklch(0.18 0.05 240) 100%)',
}

const EMPTY_TUB_FORM = { name: '', volume: '1000', sanitizer: 'klor', customRanges: {} as Record<string, { min?: string; max?: string }> }

export default function Settings() {
  const navigate = useNavigate()
  const { settings, updateSettings } = useSettings()
  const { user, facility, isAdmin, logout } = useAuth()
  const { mood, setMood } = useTheme()
  const [spaName, setSpaName] = useState(settings.spaName)
  const [volume, setVolume] = useState(String(settings.waterVolume))
  const [cycleDays, setCycleDays] = useState(String(settings.waterChangeCycleDays))
  const [saved, setSaved] = useState(false)

  const [inviteCode, setInviteCode] = useState('')
  const [users, setUsers] = useState<{ id: string; name: string; role: string; created_at: string }[]>([])
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [codeCopied, setCodeCopied] = useState(false)

  const [tubs, setTubs] = useState<Tub[]>([])
  const [showTubForm, setShowTubForm] = useState(false)
  const [tubForm, setTubForm] = useState(EMPTY_TUB_FORM)
  const [editingTubId, setEditingTubId] = useState<string | null>(null)
  const [deleteTubId, setDeleteTubId] = useState<string | null>(null)
  const [tubSaving, setTubSaving] = useState(false)
  const [tubError, setTubError] = useState('')

  useEffect(() => {
    if (isAdmin) {
      api.getInviteCode().then((d) => setInviteCode(d.inviteCode)).catch(() => {})
      api.listUsers().then(setUsers).catch(() => {})
      api.listTubs().then((rows) =>
        setTubs(rows.map((t) => ({ id: t.id, name: t.name, volume: t.volume, sanitizer: t.sanitizer, custom_ranges: t.custom_ranges ?? null })))
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
    setEditingTubId(null); setTubForm(EMPTY_TUB_FORM); setShowTubForm(true)
  }

  function openEditTub(tub: Tub) {
    const parsed = tub.custom_ranges ? JSON.parse(tub.custom_ranges) : {}
    const customRanges: Record<string, { min?: string; max?: string }> = {}
    for (const [key, val] of Object.entries(parsed)) {
      const v = val as { min?: number; max?: number }
      customRanges[key] = { min: v.min !== undefined ? String(v.min) : '', max: v.max !== undefined ? String(v.max) : '' }
    }
    setEditingTubId(tub.id); setTubForm({ name: tub.name, volume: String(tub.volume), sanitizer: tub.sanitizer, customRanges }); setShowTubForm(true)
  }

  function cancelTubForm() { setShowTubForm(false); setEditingTubId(null); setTubForm(EMPTY_TUB_FORM) }

  async function handleSaveTub(e: React.FormEvent) {
    e.preventDefault()
    const name = tubForm.name.trim()
    const vol = Number(tubForm.volume)
    if (!name || isNaN(vol) || vol <= 0) return
    setTubError(''); setTubSaving(true)
    const customRanges: Record<string, { min?: number; max?: number }> = {}
    for (const [key, val] of Object.entries(tubForm.customRanges)) {
      const min = val.min ? Number(val.min.replace(',', '.')) : undefined
      const max = val.max ? Number(val.max.replace(',', '.')) : undefined
      if (min !== undefined || max !== undefined) {
        customRanges[key] = {}
        if (min !== undefined && !isNaN(min)) customRanges[key].min = min
        if (max !== undefined && !isNaN(max)) customRanges[key].max = max
      }
    }
    const hasCustomRanges = Object.keys(customRanges).length > 0
    try {
      if (editingTubId) {
        const updated = await api.updateTub(editingTubId, { name, volume: vol, sanitizer: tubForm.sanitizer, customRanges: hasCustomRanges ? customRanges as Record<string, { min: number; max: number }> : null })
        setTubs((prev) => prev.map((t) => t.id === editingTubId ? { id: updated.id, name: updated.name, volume: updated.volume, sanitizer: updated.sanitizer, custom_ranges: updated.custom_ranges ?? null } : t))
      } else {
        const created = await api.createTub({ name, volume: vol, sanitizer: tubForm.sanitizer, customRanges: hasCustomRanges ? customRanges as Record<string, { min: number; max: number }> : undefined })
        setTubs((prev) => [...prev, { id: created.id, name: created.name, volume: created.volume, sanitizer: created.sanitizer, custom_ranges: created.custom_ranges ?? null }])
      }
      cancelTubForm()
    } catch { setTubError('Kunde inte spara badet. Försök igen.') }
    finally { setTubSaving(false) }
  }

  async function handleDeleteTub(id: string) {
    await api.deleteTub(id); setTubs((prev) => prev.filter((t) => t.id !== id)); setDeleteTubId(null)
  }

  const INPUT_CLS = 'w-full bg-cream border border-cream-border rounded-xl px-3.5 min-h-[48px] text-base text-charcoal placeholder:text-charcoal-muted focus:outline-none font-body'

  return (
    <div className="px-4 pb-4 space-y-4">
      {/* Header */}
      <div className="px-1 pt-2 pb-2">
        <div className="spa-label">Inställningar</div>
        <h1 className="spa-heading text-[32px] mt-1.5 text-charcoal">
          Justera<span className="text-accent">.</span>
        </h1>
      </div>

      {/* Atmosphere selector */}
      <div className="spa-label px-1.5 mb-1">Atmosfär</div>
      <div className="spa-card overflow-hidden !p-0">
        {(Object.keys(MOOD_META) as Mood[]).map((key, i) => {
          const m = MOOD_META[key]
          return (
            <button
              key={key}
              onClick={() => setMood(key)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors"
              style={{ borderBottom: i < 2 ? '0.5px solid var(--color-cream-border)' : 'none' }}
            >
              <div className="w-9 h-9 rounded-full flex-shrink-0" style={{ background: MOOD_GRADIENTS[key], boxShadow: 'inset 0 0 0 0.5px var(--color-cream-border)' }} />
              <div className="flex-1">
                <div className="font-display text-[17px] text-charcoal" style={{ fontWeight: 400, letterSpacing: '-0.015em' }}>{m.name}</div>
                <div className="font-body text-[11px] text-charcoal-muted" style={{ letterSpacing: '-0.005em' }}>{m.subtitle}</div>
              </div>
              {mood === key && (
                <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                  <Check size={12} className="text-cream" strokeWidth={2.5} />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* User info */}
      <div className="spa-card !p-4 flex items-center justify-between">
        <div>
          <div className="font-display text-[16px] text-charcoal" style={{ fontWeight: 400 }}>{user?.name}</div>
          <div className="font-body text-[12px] text-charcoal-muted mt-0.5">{facility?.name} — {user?.role === 'admin' ? 'Admin' : 'Personal'}</div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 text-status-error font-body text-[13px]" style={{ fontWeight: 500 }}>
          Logga ut
        </button>
      </div>

      {/* Tubs section */}
      <div className="spa-label px-1.5">Tunnor</div>
      <div className="spa-card overflow-hidden !p-0">
        {tubs.map((tub, i) => (
          <div key={tub.id} className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: i < tubs.length - 1 ? '0.5px solid var(--color-cream-border)' : 'none' }}>
            <div className="flex-1">
              <div className="font-display text-[17px] text-charcoal" style={{ fontWeight: 400 }}>{tub.name}</div>
              <div className="spa-mono text-charcoal-muted mt-0.5">{tub.volume}L · {tub.sanitizer === 'klor' ? 'Klor' : 'Brom'}</div>
            </div>
            {isAdmin && (
              <div className="flex gap-1">
                <button onClick={() => openEditTub(tub)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-charcoal-hover transition-colors" aria-label="Redigera">
                  <Pencil size={14} className="text-charcoal-muted" strokeWidth={1.5} />
                </button>
                <button onClick={() => setDeleteTubId(tub.id)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-charcoal-hover transition-colors" aria-label="Ta bort">
                  <Trash2 size={14} className="text-charcoal-muted" strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>
        ))}
        {tubs.length === 0 && !showTubForm && (
          <div className="px-4 py-3.5 text-charcoal-muted font-body text-[13px]">Inga bad tillagda ännu.</div>
        )}
      </div>

      {isAdmin && !showTubForm && (
        <button onClick={openAddTub} className="spa-pill spa-pill-inactive w-full !py-2.5 !text-[13px] text-center">
          + Lägg till bad
        </button>
      )}

      {/* Tub form */}
      {showTubForm && (
        <div className="spa-card !p-4">
          <form onSubmit={handleSaveTub} className="space-y-3">
            <div className="spa-label">{editingTubId ? 'Redigera bad' : 'Nytt bad'}</div>
            <input type="text" value={tubForm.name} onChange={(e) => setTubForm((f) => ({ ...f, name: e.target.value }))} placeholder="Namn" required className={INPUT_CLS} />
            <input type="text" inputMode="numeric" value={tubForm.volume} onChange={(e) => setTubForm((f) => ({ ...f, volume: e.target.value }))} placeholder="Volym (L)" required className={INPUT_CLS} />
            <select value={tubForm.sanitizer} onChange={(e) => setTubForm((f) => ({ ...f, sanitizer: e.target.value }))} className={INPUT_CLS}>
              <option value="klor">Klor</option>
              <option value="brom">Brom</option>
            </select>

            {/* Custom ranges */}
            <div className="space-y-2">
              <div className="spa-label !text-[10px]">Gränsvärden <span className="text-charcoal-whisper">(valfritt)</span></div>
              {OPTIMAL_RANGES.filter(r => r.key !== 'waterTemp').map((range) => {
                const custom = tubForm.customRanges[range.key as string] || {}
                return (
                  <div key={range.key} className="flex items-center gap-2">
                    <span className="font-body text-[11px] text-charcoal-muted w-14 flex-shrink-0">{range.label}</span>
                    <input type="text" inputMode="decimal" placeholder={range.min !== undefined ? String(range.min) : '–'} value={custom.min ?? ''}
                      onChange={(e) => setTubForm(f => ({ ...f, customRanges: { ...f.customRanges, [range.key]: { ...f.customRanges[range.key as string], min: e.target.value } } }))}
                      className="flex-1 bg-cream border border-cream-border rounded-lg px-2 min-h-[36px] text-sm text-charcoal font-body focus:outline-none" />
                    <span className="text-[10px] text-charcoal-muted">–</span>
                    <input type="text" inputMode="decimal" placeholder={range.max !== undefined ? String(range.max) : '–'} value={custom.max ?? ''}
                      onChange={(e) => setTubForm(f => ({ ...f, customRanges: { ...f.customRanges, [range.key]: { ...f.customRanges[range.key as string], max: e.target.value } } }))}
                      className="flex-1 bg-cream border border-cream-border rounded-lg px-2 min-h-[36px] text-sm text-charcoal font-body focus:outline-none" />
                    {range.unit && <span className="text-[10px] text-charcoal-muted w-10 flex-shrink-0">{range.unit}</span>}
                  </div>
                )
              })}
            </div>

            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={tubSaving}
                className="flex-1 py-3 bg-charcoal text-cream rounded-full font-body text-[13px] shadow-inset-btn disabled:opacity-60" style={{ fontWeight: 500 }}>
                {tubSaving ? 'Sparar…' : editingTubId ? 'Uppdatera' : 'Spara bad'}
              </button>
              <button type="button" onClick={cancelTubForm}
                className="w-12 h-12 flex items-center justify-center bg-cream-light border border-cream-border rounded-full" aria-label="Avbryt">
                <X size={16} className="text-charcoal-muted" />
              </button>
            </div>
            {tubError && <p className="font-body text-[12px] text-status-error mt-1">{tubError}</p>}
          </form>
        </div>
      )}

      {/* Local settings */}
      <div className="spa-label px-1.5 mt-2">Lokala inställningar</div>
      <form onSubmit={handleSave} className="space-y-3">
        <div className="spa-card !p-4 space-y-3">
          <div>
            <div className="spa-label !text-[10px] mb-1.5">Spa-namn</div>
            <input type="text" value={spaName} onChange={(e) => setSpaName(e.target.value)} placeholder="MSpa Bristol Urban" className={INPUT_CLS} />
          </div>
          <div>
            <div className="spa-label !text-[10px] mb-1.5">Vattenvolym (liter)</div>
            <input type="text" inputMode="numeric" value={volume} onChange={(e) => setVolume(e.target.value)} placeholder="1000" className={INPUT_CLS} />
          </div>
          <div>
            <div className="spa-label !text-[10px] mb-1.5">Vattenbytescykel (dagar)</div>
            <input type="text" inputMode="numeric" value={cycleDays} onChange={(e) => setCycleDays(e.target.value)} placeholder="90" className={INPUT_CLS} />
            <span className="font-body text-[11px] text-charcoal-muted mt-1 block">Nuvarande cykel: {formatSwedishDecimal(settings.waterChangeCycleDays)} dagar</span>
          </div>
        </div>
        <button type="submit" className="w-full py-3.5 bg-charcoal text-cream rounded-full font-body text-[15px] shadow-inset-btn active:opacity-80 transition-opacity" style={{ fontWeight: 500 }}>
          {saved ? 'Sparat!' : 'Spara inställningar'}
        </button>
      </form>

      {/* Admin section */}
      {isAdmin && (
        <>
          <div className="spa-label px-1.5 mt-2">Administration</div>

          {/* Invite code */}
          <div className="spa-card !p-4">
            <div className="spa-label !text-[10px] mb-2">Inbjudningskod</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-cream border border-cream-border rounded-xl px-3.5 min-h-[48px] flex items-center font-mono text-lg text-charcoal tracking-[4px]">
                {inviteCode}
              </div>
              <button onClick={copyCode} className="w-12 h-12 flex items-center justify-center bg-cream border border-cream-border rounded-full" aria-label="Kopiera">
                <Copy size={16} className={codeCopied ? 'text-status-ok' : 'text-charcoal-muted'} />
              </button>
              <button onClick={handleRegenerateCode} className="w-12 h-12 flex items-center justify-center bg-cream border border-cream-border rounded-full" aria-label="Generera ny">
                <RefreshCw size={16} className="text-charcoal-muted" />
              </button>
            </div>
            <p className="font-body text-[11px] text-charcoal-muted mt-2">Dela koden med personal som ska gå med.</p>
          </div>

          {/* Users */}
          <div className="spa-card !p-4">
            <div className="spa-label !text-[10px] mb-2">Personal ({users.length})</div>
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-1">
                  <div>
                    <span className="font-body text-[14px] text-charcoal">{u.name}</span>
                    <span className="font-body text-[10px] text-charcoal-muted ml-2">{u.role === 'admin' ? 'Admin' : 'Personal'}</span>
                  </div>
                  {u.id !== user?.id && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleToggleRole(u.id, u.role)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-charcoal-hover transition-colors" aria-label="Ändra roll">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                      </button>
                      <button onClick={() => setDeleteUserId(u.id)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-charcoal-hover transition-colors" aria-label="Ta bort">
                        <Trash2 size={14} className="text-charcoal-muted" strokeWidth={1.5} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {deleteUserId && (
        <ConfirmDialog title="Ta bort användare" message="Vill du verkligen ta bort denna användare?"
          onConfirm={() => handleDeleteUser(deleteUserId)} onCancel={() => setDeleteUserId(null)} />
      )}
      {deleteTubId && (
        <ConfirmDialog title="Ta bort bad" message="Vill du verkligen ta bort detta bad?"
          onConfirm={() => handleDeleteTub(deleteTubId)} onCancel={() => setDeleteTubId(null)} />
      )}
    </div>
  )
}
