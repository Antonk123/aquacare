import { Router } from 'express'
import crypto from 'crypto'
import { getDb } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

router.get('/', (req, res) => {
  const db = getDb()
  const notes = db.prepare(`
    SELECT n.*, u.name AS user_name
    FROM notes n
    JOIN users u ON n.user_id = u.id
    WHERE n.facility_id = ?
    ORDER BY n.completed ASC, n.due_date ASC
  `).all(req.facilityId)
  res.json(notes)
})

router.post('/', (req, res) => {
  const { title, dueDate } = req.body
  if (!title?.trim() || !dueDate) { res.status(400).json({ error: 'Titel och datum krävs.' }); return }

  const db = getDb()
  const id = crypto.randomUUID()
  db.prepare('INSERT INTO notes (id, facility_id, user_id, title, due_date) VALUES (?, ?, ?, ?, ?)').run(
    id, req.facilityId, req.user!.id, title.trim(), dueDate
  )
  res.status(201).json({ id, facility_id: req.facilityId, user_id: req.user!.id, user_name: req.user!.name, title: title.trim(), due_date: dueDate, completed: 0, completed_date: null })
})

router.patch('/:id', (req, res) => {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM notes WHERE id = ? AND facility_id = ?').get(req.params.id, req.facilityId) as any
  if (!existing) { res.status(404).json({ error: 'Noteringen hittades inte.' }); return }

  // Toggle complete
  if (req.body.completed !== undefined) {
    const completed = req.body.completed ? 1 : 0
    const completedDate = completed ? new Date().toISOString() : null
    db.prepare('UPDATE notes SET completed = ?, completed_date = ? WHERE id = ?').run(completed, completedDate, req.params.id)
  }

  // Update title/dueDate
  if (req.body.title) {
    db.prepare('UPDATE notes SET title = ? WHERE id = ?').run(req.body.title.trim(), req.params.id)
  }

  const updated = db.prepare('SELECT n.*, u.name AS user_name FROM notes n JOIN users u ON n.user_id = u.id WHERE n.id = ?').get(req.params.id)
  res.json(updated)
})

router.delete('/:id', (req, res) => {
  const db = getDb()
  const result = db.prepare('DELETE FROM notes WHERE id = ? AND facility_id = ?').run(req.params.id, req.facilityId)
  if (result.changes === 0) { res.status(404).json({ error: 'Noteringen hittades inte.' }); return }
  res.json({ ok: true })
})

export default router
