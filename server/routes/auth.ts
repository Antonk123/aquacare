import { Router } from 'express'
import crypto from 'crypto'
import bcryptjs from 'bcryptjs'
import { getDb } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { rateLimit } from '../middleware/rateLimit.js'

const router = Router()

// GET /api/auth/facilities — List facilities (public, for login screen)
router.get('/facilities', (_req, res) => {
  const db = getDb()
  const facilities = db.prepare('SELECT id, name FROM facilities ORDER BY name').all()
  res.json(facilities)
})

// GET /api/auth/facilities/:id/users — List users in facility (public, for login screen)
router.get('/facilities/:id/users', (req, res) => {
  const db = getDb()
  const users = db.prepare('SELECT id, name FROM users WHERE facility_id = ? ORDER BY name').all(
    req.params.id
  )
  res.json(users)
})

// POST /api/auth/login — Login with PIN
router.post('/login', rateLimit(5, 15 * 60 * 1000), (req, res) => {
  const { facilityId, userId, pin } = req.body

  if (!facilityId || !userId || !pin) {
    res.status(400).json({ error: 'Alla fält krävs.' })
    return
  }

  const db = getDb()
  const user = db.prepare('SELECT id, name, pin_hash, role, facility_id FROM users WHERE id = ? AND facility_id = ?').get(
    userId, facilityId
  ) as { id: string; name: string; pin_hash: string; role: string; facility_id: string } | undefined

  if (!user) {
    res.status(401).json({ error: 'Felaktig inloggning.' })
    return
  }

  if (!bcryptjs.compareSync(pin, user.pin_hash)) {
    res.status(401).json({ error: 'Felaktig PIN.' })
    return
  }

  const facility = db.prepare('SELECT id, name FROM facilities WHERE id = ?').get(
    facilityId
  ) as { id: string; name: string }

  const token = crypto.randomBytes(32).toString('hex')
  const now = new Date().toISOString()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  db.prepare('INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(
    token, user.id, now, expiresAt
  )

  res.json({
    token,
    user: { id: user.id, name: user.name, role: user.role },
    facility: { id: facility.id, name: facility.name },
  })
})

// POST /api/auth/logout — Invalidate session
router.post('/logout', authMiddleware, (req, res) => {
  const token = req.headers.authorization!.slice(7)
  const db = getDb()
  db.prepare('DELETE FROM sessions WHERE id = ?').run(token)
  res.json({ ok: true })
})

// GET /api/auth/me — Get current user + facility
router.get('/me', authMiddleware, (req, res) => {
  const db = getDb()
  const facility = db.prepare('SELECT id, name FROM facilities WHERE id = ?').get(
    req.facilityId
  ) as { id: string; name: string }

  res.json({
    user: { id: req.user!.id, name: req.user!.name, role: req.user!.role },
    facility,
  })
})

export default router
