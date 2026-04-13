import { Router } from 'express'
import crypto from 'crypto'
import { getDb } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

// GET /api/activity?limit=50
router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
  const db = getDb()
  const logs = db.prepare(`
    SELECT al.*, u.name AS user_name
    FROM activity_log al
    JOIN users u ON al.user_id = u.id
    WHERE al.facility_id = ?
    ORDER BY al.created_at DESC
    LIMIT ?
  `).all(req.facilityId, limit)
  res.json(logs)
})

export default router

// Helper function — exported for use in other routes
export function logActivity(facilityId: string, userId: string, action: string, targetType?: string, targetId?: string, details?: string) {
  const db = getDb()
  db.prepare('INSERT INTO activity_log (id, facility_id, user_id, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    crypto.randomUUID(), facilityId, userId, action, targetType ?? null, targetId ?? null, details ?? null, new Date().toISOString()
  )
}
