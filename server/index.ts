import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { runMigrations } from './migrate.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
import facilitiesRouter from './routes/facilities.js'
import authRouter from './routes/auth.js'
import tubsRouter from './routes/tubs.js'
import usersRouter from './routes/users.js'
import waterLogsRouter from './routes/waterLogs.js'
import notesRouter from './routes/notes.js'
import scheduleRouter from './routes/schedule.js'
import reportsRouter from './routes/reports.js'
import waterChangesRouter from './routes/waterChanges.js'

const app = express()
const PORT = parseInt(process.env.PORT || '3000', 10)

runMigrations()

app.use(cors())
app.use(express.json())

app.use('/api/facilities', facilitiesRouter)
app.use('/api/auth', authRouter)
app.use('/api/tubs', tubsRouter)
app.use('/api/users', usersRouter)
app.use('/api/water-logs', waterLogsRouter)
app.use('/api/notes', notesRouter)
app.use('/api/schedule', scheduleRouter)
app.use('/api/reports', reportsRouter)
app.use('/api/water-changes', waterChangesRouter)

const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`AquaCare server running on port ${PORT}`)
})
