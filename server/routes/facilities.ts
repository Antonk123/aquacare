import { Router } from 'express'
import crypto from 'crypto'
import bcryptjs from 'bcryptjs'
import { getDb } from '../db.js'
import { authMiddleware, adminOnly } from '../middleware/auth.js'

const router = Router()

function generateInviteCode(): string {
  return crypto.randomBytes(3).toString('hex').toUpperCase()
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// POST /api/facilities — Create facility + admin user + session
router.post('/', (req, res) => {
  const { facilityName, userName, pin } = req.body

  if (!facilityName?.trim() || !userName?.trim() || !pin) {
    res.status(400).json({ error: 'Alla fält krävs.' })
    return
  }
  if (typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
    res.status(400).json({ error: 'PIN måste vara 4 siffror.' })
    return
  }

  const db = getDb()
  const facilityId = crypto.randomUUID()
  const userId = crypto.randomUUID()
  const token = generateToken()
  const inviteCode = generateInviteCode()
  const pinHash = bcryptjs.hashSync(pin, 10)
  const now = new Date().toISOString()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const tx = db.transaction(() => {
    db.prepare('INSERT INTO facilities (id, name, created_at, invite_code) VALUES (?, ?, ?, ?)').run(
      facilityId, facilityName.trim(), now, inviteCode
    )
    db.prepare('INSERT INTO users (id, facility_id, name, pin_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      userId, facilityId, userName.trim(), pinHash, 'admin', now
    )
    db.prepare('INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(
      token, userId, now, expiresAt
    )
  })

  tx()

  res.status(201).json({
    token,
    user: { id: userId, name: userName.trim(), role: 'admin' },
    facility: { id: facilityId, name: facilityName.trim() },
    inviteCode,
  })
})

// POST /api/facilities/join — Join via invite code
router.post('/join', (req, res) => {
  const { inviteCode, userName, pin } = req.body

  if (!inviteCode?.trim() || !userName?.trim() || !pin) {
    res.status(400).json({ error: 'Alla fält krävs.' })
    return
  }
  if (typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
    res.status(400).json({ error: 'PIN måste vara 4 siffror.' })
    return
  }

  const db = getDb()
  const facility = db.prepare('SELECT id, name FROM facilities WHERE invite_code = ?').get(
    inviteCode.trim().toUpperCase()
  ) as { id: string; name: string } | undefined

  if (!facility) {
    res.status(404).json({ error: 'Ogiltig inbjudningskod.' })
    return
  }

  const userId = crypto.randomUUID()
  const token = generateToken()
  const pinHash = bcryptjs.hashSync(pin, 10)
  const now = new Date().toISOString()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const tx = db.transaction(() => {
    db.prepare('INSERT INTO users (id, facility_id, name, pin_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      userId, facility.id, userName.trim(), pinHash, 'staff', now
    )
    db.prepare('INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(
      token, userId, now, expiresAt
    )
  })

  tx()

  res.status(201).json({
    token,
    user: { id: userId, name: userName.trim(), role: 'staff' },
    facility: { id: facility.id, name: facility.name },
  })
})

// GET /api/facilities/invite — Get invite code (admin)
router.get('/invite', authMiddleware, adminOnly, (req, res) => {
  const db = getDb()
  const facility = db.prepare('SELECT invite_code FROM facilities WHERE id = ?').get(
    req.facilityId
  ) as { invite_code: string } | undefined

  if (!facility) {
    res.status(404).json({ error: 'Anläggning hittades inte.' })
    return
  }

  res.json({ inviteCode: facility.invite_code })
})

// POST /api/facilities/invite — Regenerate invite code (admin)
router.post('/invite', authMiddleware, adminOnly, (req, res) => {
  const db = getDb()
  const newCode = generateInviteCode()
  db.prepare('UPDATE facilities SET invite_code = ? WHERE id = ?').run(newCode, req.facilityId)
  res.json({ inviteCode: newCode })
})

export default router
