import { Router } from 'express'
import { getDb } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

// GET /api/reports/water-logs
// Query params: tubId, userId, from (ISO date), to (ISO date)
router.get('/water-logs', (req, res) => {
  const db = getDb()
  const { tubId, userId, from, to } = req.query as Record<string, string | undefined>

  // Default: last 30 days
  const toDate = to ? to : new Date().toISOString().split('T')[0]
  const fromDate = from
    ? from
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const conditions: string[] = [
    'wl.facility_id = ?',
    "date(wl.date) >= ?",
    "date(wl.date) <= ?",
  ]
  const params: unknown[] = [req.facilityId, fromDate, toDate]

  if (tubId) {
    conditions.push('wl.tub_id = ?')
    params.push(tubId)
  }
  if (userId) {
    conditions.push('wl.user_id = ?')
    params.push(userId)
  }

  const where = conditions.join(' AND ')

  const logs = db.prepare(`
    SELECT wl.*, u.name AS user_name, t.name AS tub_name
    FROM water_logs wl
    JOIN users u ON wl.user_id = u.id
    LEFT JOIN tubs t ON wl.tub_id = t.id
    WHERE ${where}
    ORDER BY wl.date DESC
  `).all(...params) as {
    id: string
    date: string
    ph: number | null
    free_chlorine: number | null
    total_alkalinity: number | null
    [key: string]: unknown
  }[]

  // Calculate summary stats
  const totalLogs = logs.length

  const uniqueDays = new Set(logs.map((l) => l.date.split('T')[0])).size

  // Period days between from and to (inclusive)
  const fromMs = new Date(fromDate).getTime()
  const toMs = new Date(toDate).getTime()
  const periodDays = Math.max(1, Math.round((toMs - fromMs) / (24 * 60 * 60 * 1000)) + 1)

  const compliancePercent = Math.round((uniqueDays / periodDays) * 100)

  // Average numeric values (ignore nulls)
  function avg(key: string): number | null {
    const values = logs.map((l) => l[key] as number | null).filter((v): v is number => v !== null)
    if (values.length === 0) return null
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
  }

  const summary = {
    totalLogs,
    uniqueDays,
    periodDays,
    compliancePercent,
    avgPh: avg('ph'),
    avgChlorine: avg('free_chlorine'),
    avgAlkalinity: avg('total_alkalinity'),
  }

  res.json({ logs, summary })
})

export default router
