import { useCallback } from 'react'
import type { Note } from '../types'
import { useLocalStorage } from './useLocalStorage'
import { STORAGE_KEYS } from '../constants'

export function useNotes() {
  const [notes, setNotes] = useLocalStorage<Note[]>(STORAGE_KEYS.notes, [])

  const addNote = useCallback(
    (title: string, dueDate: string) => {
      const note: Note = {
        id: crypto.randomUUID(),
        title,
        dueDate,
        completed: false,
      }
      setNotes((prev) => [note, ...prev])
      return note
    },
    [setNotes],
  )

  const toggleNote = useCallback(
    (id: string) => {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, completed: !n.completed, completedDate: !n.completed ? new Date().toISOString() : undefined }
            : n,
        ),
      )
    },
    [setNotes],
  )

  const deleteNote = useCallback(
    (id: string) => {
      setNotes((prev) => prev.filter((n) => n.id !== id))
    },
    [setNotes],
  )

  return { notes, addNote, toggleNote, deleteNote }
}
