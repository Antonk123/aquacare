import { Router } from 'express'
import { getDb } from '../db.js'
import { authMiddleware, adminOnly } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

router.get('/', (req, res) => {
  const db = getDb()
  const users = db.prepare('SELECT id, name, role, created_at FROM users WHERE facility_id = ? ORDER BY name').all(req.facilityId)
  res.json(users)
})

router.delete('/:id', adminOnly, (req, res) => {
  if (req.params.id === req.user!.id) { res.status(400).json({ error: 'Du kan inte ta bort dig själv.' }); return }
  const db = getDb()
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(req.params.id)
    const result = db.prepare('DELETE FROM users WHERE id = ? AND facility_id = ?').run(req.params.id, req.facilityId)
    return result.changes
  })
  const changes = tx()
  if (changes === 0) { res.status(404).json({ error: 'Användaren hittades inte.' }); return }
  res.json({ ok: true })
})

router.patch('/:id/role', adminOnly, (req, res) => {
  const { role } = req.body
  if (role !== 'admin' && role !== 'staff') { res.status(400).json({ error: 'Roll måste vara admin eller staff.' }); return }
  if (req.params.id === req.user!.id) { res.status(400).json({ error: 'Du kan inte ändra din egen roll.' }); return }
  const db = getDb()
  const result = db.prepare('UPDATE users SET role = ? WHERE id = ? AND facility_id = ?').run(role, req.params.id, req.facilityId)
  if (result.changes === 0) { res.status(404).json({ error: 'Användaren hittades inte.' }); return }
  res.json({ ok: true })
})

export default router
