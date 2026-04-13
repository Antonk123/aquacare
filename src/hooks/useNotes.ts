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
      const current = notes.find((n) => n.id === id)
      if (!current) return
      const row = await api.updateNote(id, { completed: !current.completed })
      const mapped = mapFromApi(row)
      setNotes((prev) => prev.map((n) => (n.id === id ? mapped : n)))
    },
    [notes],
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
