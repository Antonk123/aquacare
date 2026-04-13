import { Router } from 'express'
import crypto from 'crypto'
import { getDb } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

// GET /api/water-logs — list logs (newest first, last 100)
router.get('/', (req, res) => {
  const db = getDb()
  const logs = db.prepare(`
    SELECT wl.*, u.name AS user_name
    FROM water_logs wl
    JOIN users u ON wl.user_id = u.id
    WHERE wl.facility_id = ?
    ORDER BY wl.date DESC
    LIMIT 100
  `).all(req.facilityId)
  res.json(logs)
})

// POST /api/water-logs — create log
router.post('/', (req, res) => {
  const { tubId, date, note, ph, freeChlorine, bromine, totalAlkalinity, calciumHardness, tds, waterTemp } = req.body
  const db = getDb()
  const id = crypto.randomUUID()
  const logDate = date || new Date().toISOString()

  db.prepare(`
    INSERT INTO water_logs (id, facility_id, user_id, tub_id, date, note, ph, free_chlorine, bromine, total_alkalinity, calcium_hardness, tds, water_temp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.facilityId, req.user!.id, tubId ?? null, logDate, note ?? null,
    ph ?? null, freeChlorine ?? null, bromine ?? null, totalAlkalinity ?? null,
    calciumHardness ?? null, tds ?? null, waterTemp ?? null)

  res.status(201).json({
    id, facility_id: req.facilityId, user_id: req.user!.id, user_name: req.user!.name,
    tub_id: tubId ?? null, date: logDate, note: note ?? null,
    ph: ph ?? null, free_chlorine: freeChlorine ?? null, bromine: bromine ?? null,
    total_alkalinity: totalAlkalinity ?? null, calcium_hardness: calciumHardness ?? null,
    tds: tds ?? null, water_temp: waterTemp ?? null,
  })
})

// PATCH /api/water-logs/:id — update log
router.patch('/:id', (req, res) => {
  const { note, ph, freeChlorine, bromine, totalAlkalinity, calciumHardness, tds, waterTemp } = req.body
  const db = getDb()

  const existing = db.prepare('SELECT id FROM water_logs WHERE id = ? AND facility_id = ?').get(req.params.id, req.facilityId)
  if (!existing) { res.status(404).json({ error: 'Loggningen hittades inte.' }); return }

  db.prepare(`
    UPDATE water_logs SET note = ?, ph = ?, free_chlorine = ?, bromine = ?, total_alkalinity = ?, calcium_hardness = ?, tds = ?, water_temp = ?
    WHERE id = ? AND facility_id = ?
  `).run(note ?? null, ph ?? null, freeChlorine ?? null, bromine ?? null,
    totalAlkalinity ?? null, calciumHardness ?? null, tds ?? null, waterTemp ?? null,
    req.params.id, req.facilityId)

  const updated = db.prepare(`
    SELECT wl.*, u.name AS user_name FROM water_logs wl JOIN users u ON wl.user_id = u.id WHERE wl.id = ?
  `).get(req.params.id)
  res.json(updated)
})

// DELETE /api/water-logs/:id
router.delete('/:id', (req, res) => {
  const db = getDb()
  const result = db.prepare('DELETE FROM water_logs WHERE id = ? AND facility_id = ?').run(req.params.id, req.facilityId)
  if (result.changes === 0) { res.status(404).json({ error: 'Loggningen hittades inte.' }); return }
  res.json({ ok: true })
})

export default router
