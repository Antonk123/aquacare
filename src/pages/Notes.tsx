import { useState } from 'react'
import { Plus, Clock, Check, X } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useNotes } from '../hooks/useNotes'

const INPUT_CLS =
  'w-full bg-cream-light border border-cream-border rounded-md px-3.5 min-h-[48px] text-base text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:shadow-focus-warm transition-shadow duration-200'

const LABEL_CLS = 'block text-[12px] text-charcoal-muted mb-1.5 font-medium tracking-tight'

function formatDueDate(iso: string, completed: boolean, completedDate?: string): string {
  if (completed && completedDate) {
    return `Klar ${new Date(completedDate).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}`
  }
  return `Förfaller ${new Date(iso).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}`
}

function isOverdue(iso: string): boolean {
  const due = new Date(iso)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  return due.getTime() < today.getTime()
}

export default function Notes() {
  const { notes, addNote, toggleNote, deleteNote } = useNotes()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

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
        <h1 className="font-display text-[28px] leading-none font-semibold text-charcoal tracking-[-0.035em]">
          Noteringar
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 bg-charcoal text-cream-light rounded-md px-4 font-medium text-[13px] min-h-[40px] tracking-tight shadow-inset-btn active:opacity-80 transition-opacity"
        >
          <Plus size={16} strokeWidth={2} />
          Lägg till
        </button>
      </div>

      {showForm && (
        <GlassCard>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className={LABEL_CLS}>Titel</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="T.ex. Byt filterpatron"
                className={INPUT_CLS}
                autoFocus
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Förfallodatum</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 w-full min-h-[48px] bg-charcoal text-cream-light rounded-md font-medium text-[15px] tracking-tight shadow-inset-btn transition-opacity duration-200 active:opacity-80"
            >
              Spara
            </button>
          </form>
        </GlassCard>
      )}

      {pending.length === 0 && completed.length === 0 && !showForm && (
        <GlassCard className="text-center py-8">
          <p className="text-sm text-charcoal-muted">Inga noteringar ännu</p>
        </GlassCard>
      )}

      {pending.length > 0 && (
        <>
          <div className="text-[11px] text-charcoal-muted uppercase tracking-[1.5px] font-medium pt-1">
            Kommande
          </div>
          <div className="space-y-2">
            {pending.map((note) => {
              const overdue = isOverdue(note.dueDate)
              return (
                <GlassCard key={note.id} className="flex items-start gap-3">
                  <div
                    className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-md flex-shrink-0 ${
                      overdue
                        ? 'bg-status-alert/10 border border-status-alert/20'
                        : 'bg-charcoal-whisper border border-cream-border'
                    }`}
                  >
                    <Clock
                      size={18}
                      className={overdue ? 'text-status-alert' : 'text-charcoal'}
                      strokeWidth={1.75}
                    />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="text-[14px] text-charcoal font-medium tracking-tight">
                      {note.title}
                    </div>
                    <div
                      className={`text-[11px] mt-1 ${
                        overdue ? 'text-status-alert font-medium' : 'text-charcoal-muted'
                      }`}
                    >
                      {formatDueDate(note.dueDate, false)}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleNote(note.id)}
                    className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-md hover:bg-charcoal-hover transition-colors"
                    aria-label="Markera klar"
                  >
                    <Check size={18} className="text-charcoal-muted" strokeWidth={1.75} />
                  </button>
                </GlassCard>
              )
            })}
          </div>
        </>
      )}

      {completed.length > 0 && (
        <>
          <div className="text-[11px] text-charcoal-muted uppercase tracking-[1.5px] font-medium pt-2">
            Klara
          </div>
          <div className="space-y-2">
            {completed.map((note) => (
              <div
                key={note.id}
                className="bg-cream border border-cream-border rounded-xl p-4 flex items-start gap-3"
              >
                <div className="min-w-[40px] min-h-[40px] flex items-center justify-center bg-status-ok/10 border border-status-ok/20 rounded-md flex-shrink-0">
                  <Check size={18} className="text-status-ok" strokeWidth={2.25} />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="text-[14px] text-charcoal-muted line-through tracking-tight">
                    {note.title}
                  </div>
                  <div className="text-[11px] text-charcoal-muted/70 mt-1">
                    {formatDueDate(note.dueDate, true, note.completedDate)}
                  </div>
                </div>
                <button
                  onClick={() => setDeleteId(note.id)}
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-md hover:bg-charcoal-hover transition-colors"
                  aria-label="Ta bort"
                >
                  <X size={18} className="text-charcoal-muted" strokeWidth={1.75} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Ta bort notering"
          message="Vill du verkligen ta bort denna notering? Det går inte att ångra."
          onConfirm={() => { deleteNote(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
