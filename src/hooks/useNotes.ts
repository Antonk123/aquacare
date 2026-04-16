import { useState, useEffect, useCallback } from 'react'
import type { Note } from '../types'
import { api } from '../lib/api'

function mapFromApi(row: any): Note {
  return {
    id: row.id,
    title: row.title,
    dueDate: row.due_date,
    completed: !!row.completed,
    completedDate: row.completed_date ?? undefined,
  }
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([])

  useEffect(() => {
    api.listNotes().then((rows) => setNotes(rows.map(mapFromApi))).catch(() => {})
  }, [])

  const addNote = useCallback(
    async (title: string, dueDate: string) => {
      const row = await api.createNote({ title, dueDate })
      const mapped = mapFromApi(row)
      setNotes((prev) => [mapped, ...prev])
      return mapped
    },
    [],
  )

  const toggleNote = useCallback(
    async (id: string) => {
      // Read current state via setter to avoid stale closure
      let current: Note | undefined
      setNotes((prev) => { current = prev.find((n) => n.id === id); return prev })
      if (!current) return
      const row = await api.updateNote(id, { completed: !current.completed })
      const mapped = mapFromApi(row)
      setNotes((prev) => prev.map((n) => (n.id === id ? mapped : n)))
    },
    [],
  )

  const deleteNote = useCallback(
    async (id: string) => {
      await api.deleteNote(id)
      setNotes((prev) => prev.filter((n) => n.id !== id))
    },
    [],
  )

  return { notes, addNote, toggleNote, deleteNote }
}
