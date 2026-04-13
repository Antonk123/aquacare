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

// GET /api/auth/streak — compute streak from water_logs
router.get('/streak', authMiddleware, (req, res) => {
  const db = getDb()
  const logs = db.prepare(`
    SELECT DISTINCT date(date) AS log_date
    FROM water_logs
    WHERE facility_id = ?
    ORDER BY log_date DESC
    LIMIT 365
  `).all(req.facilityId) as { log_date: string }[]

  if (logs.length === 0) {
    res.json({ currentStreak: 0, bestStreak: 0, lastLogDate: '' })
    return
  }

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  let currentStreak = 0
  let bestStreak = 0
  let tempStreak = 0
  let prevDate: string | null = null

  for (const { log_date } of logs) {
    if (!prevDate) {
      // First entry — only count if today or yesterday
      if (log_date === today || log_date === yesterday) {
        tempStreak = 1
      } else {
        tempStreak = 1 // Count for best streak calculation
      }
    } else {
      const prev = new Date(prevDate)
      const curr = new Date(log_date)
      const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000)
      if (diffDays === 1) {
        tempStreak++
      } else {
        bestStreak = Math.max(bestStreak, tempStreak)
        tempStreak = 1
      }
    }

    if (!currentStreak && prevDate === null && (log_date === today || log_date === yesterday)) {
      // Will be set after loop
    }

    prevDate = log_date
  }
  bestStreak = Math.max(bestStreak, tempStreak)

  // Current streak: count consecutive days ending at today or yesterday
  currentStreak = 0
  for (const { log_date } of logs) {
    const expected = new Date(Date.now() - currentStreak * 86400000).toISOString().split('T')[0]
    const expectedYesterday = new Date(Date.now() - (currentStreak + 1) * 86400000).toISOString().split('T')[0]
    if (currentStreak === 0 && log_date !== today && log_date !== yesterday) break
    if (currentStreak === 0) {
      currentStreak = 1
      continue
    }
    const prevExpected = new Date(Date.now() - currentStreak * 86400000).toISOString().split('T')[0]
    if (log_date === prevExpected) {
      currentStreak++
    } else {
      break
    }
  }

  res.json({ currentStreak, bestStreak, lastLogDate: logs[0].log_date })
})

export default router
