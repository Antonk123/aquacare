import { Router } from 'express'
import crypto from 'crypto'
import { getDb } from '../db'
import { authMiddleware, adminOnly } from '../middleware/auth'

const router = Router()
router.use(authMiddleware)

router.get('/', (req, res) => {
  const db = getDb()
  const tubs = db.prepare(
    'SELECT id, name, volume, target_temp, sanitizer, created_at FROM tubs WHERE facility_id = ? AND archived = 0 ORDER BY name'
  ).all(req.facilityId)
  res.json(tubs)
})

router.post('/', adminOnly, (req, res) => {
  const { name, volume, targetTemp, sanitizer } = req.body
  if (!name?.trim() || !volume || typeof volume !== 'number' || volume <= 0) {
    res.status(400).json({ error: 'Namn och volym krävs.' })
    return
  }
  const san = sanitizer === 'bromine' ? 'bromine' : 'chlorine'
  const db = getDb()
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  db.prepare(
    'INSERT INTO tubs (id, facility_id, name, volume, target_temp, sanitizer, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, req.facilityId, name.trim(), volume, targetTemp ?? null, san, now)
  res.status(201).json({ id, name: name.trim(), volume, target_temp: targetTemp ?? null, sanitizer: san, created_at: now })
})

router.patch('/:id', adminOnly, (req, res) => {
  const { name, volume, targetTemp, sanitizer } = req.body
  const db = getDb()
  const tub = db.prepare('SELECT id FROM tubs WHERE id = ? AND facility_id = ? AND archived = 0').get(req.params.id, req.facilityId)
  if (!tub) { res.status(404).json({ error: 'Badet hittades inte.' }); return }

  const updates: string[] = []
  const values: unknown[] = []
  if (name?.trim()) { updates.push('name = ?'); values.push(name.trim()) }
  if (typeof volume === 'number' && volume > 0) { updates.push('volume = ?'); values.push(volume) }
  if (targetTemp !== undefined) { updates.push('target_temp = ?'); values.push(targetTemp) }
  if (sanitizer === 'chlorine' || sanitizer === 'bromine') { updates.push('sanitizer = ?'); values.push(sanitizer) }

  if (updates.length === 0) { res.status(400).json({ error: 'Inga fält att uppdatera.' }); return }

  values.push(req.params.id, req.facilityId)
  db.prepare(`UPDATE tubs SET ${updates.join(', ')} WHERE id = ? AND facility_id = ?`).run(...values)
  const updated = db.prepare('SELECT id, name, volume, target_temp, sanitizer, created_at FROM tubs WHERE id = ?').get(req.params.id)
  res.json(updated)
})

router.delete('/:id', adminOnly, (req, res) => {
  const db = getDb()
  const result = db.prepare('UPDATE tubs SET archived = 1 WHERE id = ? AND facility_id = ? AND archived = 0').run(req.params.id, req.facilityId)
  if (result.changes === 0) { res.status(404).json({ error: 'Badet hittades inte.' }); return }
  res.json({ ok: true })
})

export default router
