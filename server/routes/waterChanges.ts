import { Router } from 'express'
import crypto from 'crypto'
import { getDb } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

// GET /api/water-changes/latest — get latest water change for facility
router.get('/latest', (req, res) => {
  const db = getDb()
  const latest = db.prepare(`
    SELECT wc.changed_at, u.name AS user_name, t.name AS tub_name
    FROM water_changes wc
    JOIN users u ON wc.user_id = u.id
    LEFT JOIN tubs t ON wc.tub_id = t.id
    WHERE wc.facility_id = ?
    ORDER BY wc.changed_at DESC
    LIMIT 1
  `).get(req.facilityId)
  res.json(latest || null)
})

// POST /api/water-changes — mark water change
router.post('/', (req, res) => {
  const { tubId } = req.body
  const db = getDb()
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  db.prepare('INSERT INTO water_changes (id, facility_id, tub_id, user_id, changed_at) VALUES (?, ?, ?, ?, ?)').run(
    id, req.facilityId, tubId ?? null, req.user!.id, now
  )
  res.status(201).json({ id, changed_at: now, user_name: req.user!.name })
})

export default router
