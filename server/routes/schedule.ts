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

// GET /api/schedule/:period?tubId=xxx — get completions for current period
router.get('/:period', (req, res) => {
  const periodKey = getPeriodKey(req.params.period)
  const tubId = req.query.tubId as string | undefined
  const db = getDb()

  let query = `
    SELECT sc.task_id, sc.tub_id, sc.completed_at, u.name AS user_name
    FROM schedule_completions sc
    JOIN users u ON sc.user_id = u.id
    WHERE sc.facility_id = ? AND sc.period_key = ?
  `
  const params: any[] = [req.facilityId, periodKey]

  if (tubId) {
    query += ' AND sc.tub_id = ?'
    params.push(tubId)
  }

  const completions = db.prepare(query).all(...params)
  res.json({ periodKey, completions })
})

// POST /api/schedule/:period/:taskId — toggle task completion
router.post('/:period/:taskId', (req, res) => {
  const periodKey = getPeriodKey(req.params.period)
  const tubId = req.body.tubId ?? null
  const db = getDb()

  const existing = db.prepare(
    'SELECT id FROM schedule_completions WHERE facility_id = ? AND task_id = ? AND period_key = ? AND (tub_id = ? OR (tub_id IS NULL AND ? IS NULL))'
  ).get(req.facilityId, req.params.taskId, periodKey, tubId, tubId) as { id: string } | undefined

  if (existing) {
    db.prepare('DELETE FROM schedule_completions WHERE id = ?').run(existing.id)
    res.json({ completed: false })
  } else {
    const id = crypto.randomUUID()
    db.prepare(
      'INSERT INTO schedule_completions (id, facility_id, user_id, task_id, period_key, completed_at, tub_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, req.facilityId, req.user!.id, req.params.taskId, periodKey, new Date().toISOString(), tubId)
    res.json({ completed: true, userName: req.user!.name })
  }
})

export default router
