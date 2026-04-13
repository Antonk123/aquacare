import { Router } from 'express'
import crypto from 'crypto'
import { getDb } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

function getPeriodKey(period: string): string {
  const now = new Date()
  switch (period) {
    case 'daily':
      return now.toISOString().split('T')[0]
    case 'weekly': {
      const day = now.getDay()
      const monday = new Date(now)
      monday.setDate(now.getDate() - ((day + 6) % 7))
      return monday.toISOString().split('T')[0]
    }
    case 'monthly':
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    case 'quarterly': {
      const quarter = Math.floor(now.getMonth() / 3)
      return `${now.getFullYear()}-${String(quarter * 3 + 1).padStart(2, '0')}-01`
    }
    default:
      return now.toISOString().split('T')[0]
  }
}

// GET /api/schedule/:period — get completions for current period
router.get('/:period', (req, res) => {
  const periodKey = getPeriodKey(req.params.period)
  const db = getDb()
  const completions = db.prepare(`
    SELECT sc.task_id, sc.completed_at, u.name AS user_name
    FROM schedule_completions sc
    JOIN users u ON sc.user_id = u.id
    WHERE sc.facility_id = ? AND sc.period_key = ?
  `).all(req.facilityId, periodKey)
  res.json({ periodKey, completions })
})

// POST /api/schedule/:period/:taskId — toggle task completion
router.post('/:period/:taskId', (req, res) => {
  const periodKey = getPeriodKey(req.params.period)
  const db = getDb()

  const existing = db.prepare(
    'SELECT id FROM schedule_completions WHERE facility_id = ? AND task_id = ? AND period_key = ?'
  ).get(req.facilityId, req.params.taskId, periodKey) as { id: string } | undefined

  if (existing) {
    db.prepare('DELETE FROM schedule_completions WHERE id = ?').run(existing.id)
    res.json({ completed: false })
  } else {
    const id = crypto.randomUUID()
    db.prepare(
      'INSERT INTO schedule_completions (id, facility_id, user_id, task_id, period_key, completed_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, req.facilityId, req.user!.id, req.params.taskId, periodKey, new Date().toISOString())
    res.json({ completed: true, userName: req.user!.name })
  }
})

export default router
