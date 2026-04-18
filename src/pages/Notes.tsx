import { useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useNotes } from '../hooks/useNotes'

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
    <div className="px-4 pb-4 space-y-4">
      {/* Header */}
      <div className="px-1 pt-2 pb-2 flex items-start justify-between">
        <div>
          <div className="spa-label">Anteckningar</div>
          <h1 className="spa-heading text-[32px] mt-1.5 text-charcoal">
            Anteckningar<span className="text-accent">.</span>
          </h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="mt-4 flex items-center gap-1.5 bg-charcoal text-cream rounded-full px-4 py-2 font-body text-[13px] shadow-inset-btn active:opacity-80 transition-opacity"
          style={{ fontWeight: 500, letterSpacing: '-0.01em' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Lägg till
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="spa-card !p-4 space-y-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <div className="spa-label !text-[10px] mb-1.5">Titel</div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="T.ex. Byt filterpatron"
                className="w-full bg-cream border border-cream-border rounded-xl px-3.5 min-h-[48px] text-base text-charcoal placeholder:text-charcoal-muted focus:outline-none font-body"
                autoFocus
              />
            </div>
            <div>
              <div className="spa-label !text-[10px] mb-1.5">Förfallodatum</div>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-cream border border-cream-border rounded-xl px-3.5 min-h-[48px] text-base text-charcoal focus:outline-none font-body"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 bg-charcoal text-cream rounded-full font-body text-[15px] shadow-inset-btn active:opacity-80 transition-opacity"
              style={{ fontWeight: 500 }}
            >
              Spara
            </button>
          </form>
        </div>
      )}

      {pending.length === 0 && completed.length === 0 && !showForm && (
        <div className="spa-card p-8 text-center">
          <p className="text-charcoal-muted font-body text-[14px]">Inga noteringar ännu</p>
        </div>
      )}

      {/* Pending notes */}
      {pending.map((note) => {
        const overdue = isOverdue(note.dueDate)
        return (
          <div key={note.id} className="spa-card !p-5 relative">
            <div className="spa-mono text-charcoal-whisper mb-1.5" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {note.dueDate}
            </div>
            <div className="font-display text-[20px] text-charcoal leading-snug" style={{ fontWeight: 400, letterSpacing: '-0.02em' }}>
              {note.title}
            </div>
            <div className={`font-body text-[12px] mt-2 ${overdue ? 'text-status-error font-medium' : 'text-charcoal-muted'}`}>
              {formatDueDate(note.dueDate, false)}
            </div>
            <button
              onClick={() => toggleNote(note.id)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full border border-cream-border flex items-center justify-center hover:bg-charcoal-hover transition-colors"
              aria-label="Markera klar"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5L20 7" />
              </svg>
            </button>
          </div>
        )
      })}

      {/* Completed notes */}
      {completed.length > 0 && (
        <>
          <div className="flex items-center gap-2.5 px-0.5 mt-2">
            <div className="font-display text-[15px] italic text-charcoal-muted" style={{ fontWeight: 300 }}>klara</div>
            <div className="flex-1 h-px bg-cream-border" />
          </div>
          {completed.map((note) => (
            <div key={note.id} className="spa-card !p-5 relative opacity-60">
              <div className="spa-mono text-charcoal-whisper mb-1.5" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {note.dueDate}
              </div>
              <div className="font-display text-[20px] text-charcoal-muted line-through leading-snug" style={{ fontWeight: 400, letterSpacing: '-0.02em' }}>
                {note.title}
              </div>
              <div className="font-body text-[12px] text-charcoal-muted mt-2">
                {formatDueDate(note.dueDate, true, note.completedDate)}
              </div>
              <button
                onClick={() => setDeleteId(note.id)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full border border-cream-border flex items-center justify-center hover:bg-charcoal-hover transition-colors"
                aria-label="Ta bort"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
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
