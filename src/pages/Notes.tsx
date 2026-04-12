import { useState } from 'react'
import { Plus, Clock, Check, X } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { useNotes } from '../hooks/useNotes'

function formatDueDate(iso: string, completed: boolean, completedDate?: string): string {
  if (completed && completedDate) {
    return `Klar ${new Date(completedDate).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}`
  }
  return `Förfaller ${new Date(iso).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}`
}

export default function Notes() {
  const { notes, addNote, toggleNote, deleteNote } = useNotes()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !dueDate) return
    addNote(title.trim(), dueDate)
    setTitle('')
    setDueDate('')
    setShowForm(false)
  }

  const pending = notes.filter((n) => !n.completed)
  const completed = notes.filter((n) => n.completed)

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl text-gold font-bold">Noteringar</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 bg-gradient-to-br from-gold to-gold-dark text-navy rounded-xl px-4 font-bold text-[13px] min-h-[44px]"
        >
          <Plus size={16} strokeWidth={2.5} />
          Lägg till
        </button>
      </div>

      {showForm && (
        <GlassCard>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Titel</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="T.ex. Byt filterpatron"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-colors duration-200"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Förfallodatum</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-sm text-slate-200 focus:outline-none focus:border-gold/40 transition-colors duration-200 [color-scheme:dark]"
              />
            </div>
            <button
              type="submit"
              className="w-full min-h-[48px] bg-gradient-to-br from-gold to-gold-dark text-navy rounded-[14px] font-bold text-sm transition-transform duration-200 active:scale-[0.98]"
            >
              Spara
            </button>
          </form>
        </GlassCard>
      )}

      {pending.length === 0 && completed.length === 0 && !showForm && (
        <GlassCard className="text-center py-6">
          <p className="text-sm text-slate-400">Inga noteringar ännu</p>
        </GlassCard>
      )}

      {pending.map((note) => (
        <GlassCard key={note.id} className="flex items-start gap-3">
          <div className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-gold/10 rounded-xl">
            <Clock size={20} className="text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-slate-200 font-medium">{note.title}</div>
            <div className="text-xs text-gold mt-1">{formatDueDate(note.dueDate, false)}</div>
          </div>
          <button
            onClick={() => toggleNote(note.id)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Markera klar"
          >
            <Check size={18} className="text-slate-600" />
          </button>
        </GlassCard>
      ))}

      {completed.map((note) => (
        <div
          key={note.id}
          className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-start gap-3 opacity-60"
        >
          <div className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-status-ok/10 rounded-xl">
            <Check size={20} className="text-status-ok" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-slate-400 line-through">{note.title}</div>
            <div className="text-xs text-slate-600 mt-1">{formatDueDate(note.dueDate, true, note.completedDate)}</div>
          </div>
          <button
            onClick={() => deleteNote(note.id)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Ta bort"
          >
            <X size={18} className="text-slate-600" />
          </button>
        </div>
      ))}
    </div>
  )
}
