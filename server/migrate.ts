import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getDb } from './db'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function runMigrations(): void {
  const db = getDb()

  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `)

  const migrationsDir = path.join(__dirname, 'migrations')
  const dir = fs.existsSync(migrationsDir)
    ? migrationsDir
    : path.join(__dirname, '..', 'server', 'migrations')

  const applied = new Set(
    db.prepare('SELECT name FROM _migrations').all().map((r: any) => r.name)
  )

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    if (applied.has(file)) continue
    const sql = fs.readFileSync(path.join(dir, file), 'utf-8')
    db.exec(sql)
    db.prepare('INSERT INTO _migrations (name, applied_at) VALUES (?, ?)').run(
      file,
      new Date().toISOString()
    )
    console.log(`Migration applied: ${file}`)
  }
}
