import type { Request, Response, NextFunction } from 'express'
import { getDb } from '../db.js'

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; name: string; role: string; facilityId: string }
      facilityId?: string
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Ingen giltig token.' })
    return
  }

  const token = header.slice(7)
  const db = getDb()

  const session = db.prepare(`
    SELECT s.id, s.expires_at, u.id AS user_id, u.name, u.role, u.facility_id
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ?
  `).get(token) as {
    id: string; expires_at: string; user_id: string; name: string; role: string; facility_id: string
  } | undefined

  if (!session) {
    res.status(401).json({ error: 'Ogiltig token.' })
    return
  }

  if (new Date(session.expires_at) < new Date()) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(token)
    res.status(401).json({ error: 'Token har gått ut.' })
    return
  }

  req.user = {
    id: session.user_id,
    name: session.name,
    role: session.role,
    facilityId: session.facility_id,
  }
  req.facilityId = session.facility_id
  next()
}

export function adminOnly(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Administratörsbehörighet krävs.' })
    return
  }
  next()
}
