# Fas 1: Backend + Auth — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Express + SQLite backend with PIN-based auth, invitation codes, and tub management to the existing AquaCare React app.

**Architecture:** Express server in `server/` serves both the API (`/api/*`) and the built React frontend (static files from `dist/`). SQLite with WAL mode stores all data. Auth uses bcryptjs-hashed PINs with token-based sessions (30-day expiry). Frontend gets an AuthProvider context, API client module, and 4 new auth pages.

**Tech Stack:** Express, better-sqlite3, bcryptjs, crypto.randomUUID, tsx (dev), existing React 19 + TypeScript + Tailwind CSS 4 + Vite frontend.

**Design Spec:** `docs/superpowers/specs/2026-04-13-backend-auth-design.md`

---

## File Structure

### Server (all new)

| File | Responsibility |
|------|---------------|
| `server/index.ts` | Express app setup, middleware stack, static file serving, listen |
| `server/db.ts` | SQLite connection (WAL mode), typed query helpers |
| `server/migrate.ts` | Read and run SQL migration files at startup |
| `server/middleware/auth.ts` | Token validation → `req.user`, `req.facilityId` |
| `server/middleware/rateLimit.ts` | In-memory rate limiter (per-IP, per-user) |
| `server/routes/facilities.ts` | POST create, POST join, GET/POST invite |
| `server/routes/auth.ts` | POST login, POST logout, GET me, GET facilities list, GET users list |
| `server/routes/tubs.ts` | GET list, POST create, PATCH update, DELETE archive |
| `server/routes/users.ts` | GET list, DELETE remove, PATCH role |
| `server/migrations/001_initial.sql` | CREATE TABLE for facilities, users, tubs, sessions |
| `server/tsconfig.json` | TypeScript config for server (CommonJS output, ES2022 target) |

### Frontend (new files)

| File | Responsibility |
|------|---------------|
| `src/lib/api.ts` | Fetch wrapper with auth token header, error handling |
| `src/contexts/AuthContext.tsx` | AuthProvider, useAuth hook, ProtectedRoute |
| `src/pages/Welcome.tsx` | Landing: "Skapa anläggning" or "Jag har en kod" |
| `src/pages/CreateFacility.tsx` | Form: facility name, user name, PIN |
| `src/pages/JoinFacility.tsx` | Form: invite code, user name, PIN |
| `src/pages/Login.tsx` | Select facility → select user → enter PIN |

### Modified files

| File | Change |
|------|--------|
| `package.json` | Add server deps, build:server script, dev:server script |
| `tsconfig.json` | Add reference to server/tsconfig.json |
| `vite.config.ts` | Add proxy for /api in dev mode |
| `src/App.tsx` | Wrap in AuthProvider, add auth routes, ProtectedRoute |
| `src/pages/Settings.tsx` | Add user info, logout button, admin invite/user management |
| `Dockerfile` | Build server + frontend, run Express instead of Nginx |
| `docker-compose.yml` | Mount data volume, change port from 80 to 3000 |
| `.gitignore` | Add `data/`, `server-dist/` |

---

### Task 1: Project Setup — Dependencies & Build Config

**Files:**
- Modify: `package.json`
- Create: `server/tsconfig.json`
- Modify: `tsconfig.json`
- Modify: `vite.config.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Install server dependencies**

```bash
npm install express cors better-sqlite3 bcryptjs
npm install -D @types/express @types/cors @types/better-sqlite3 @types/bcryptjs tsx
```

- [ ] **Step 2: Add server scripts to package.json**

Add to the `"scripts"` section in `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:server": "tsx watch server/index.ts",
    "build": "tsc -b && vite build",
    "build:server": "tsc -p server/tsconfig.json",
    "start": "node server-dist/index.js",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

- [ ] **Step 3: Create server/tsconfig.json**

Create `server/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "../server-dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": false
  },
  "include": ["./**/*.ts"]
}
```

- [ ] **Step 4: Add server reference to root tsconfig.json**

Update `tsconfig.json` to add the server reference:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" },
    { "path": "./server/tsconfig.json" }
  ]
}
```

- [ ] **Step 5: Add Vite dev proxy for /api**

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
```

- [ ] **Step 6: Update .gitignore**

Append to `.gitignore`:

```
data/
server-dist/
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npx tsc -p server/tsconfig.json --noEmit
```

Expected: No errors (no source files yet, should be clean).

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json server/tsconfig.json tsconfig.json vite.config.ts .gitignore
git commit -m "chore: add server dependencies and build config for backend"
```

---

### Task 2: Database Layer — SQLite + Migrations

**Files:**
- Create: `server/db.ts`
- Create: `server/migrate.ts`
- Create: `server/migrations/001_initial.sql`

- [ ] **Step 1: Create the migration SQL**

Create `server/migrations/001_initial.sql`:

```sql
CREATE TABLE IF NOT EXISTS facilities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tubs (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  volume INTEGER NOT NULL,
  target_temp REAL,
  sanitizer TEXT NOT NULL DEFAULT 'chlorine' CHECK (sanitizer IN ('chlorine', 'bromine')),
  created_at TEXT NOT NULL,
  archived INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_facility ON users(facility_id);
CREATE INDEX IF NOT EXISTS idx_tubs_facility ON tubs(facility_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
```

- [ ] **Step 2: Create server/db.ts**

Create `server/db.ts`:

```typescript
import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'aquacare.db')

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    const fs = require('fs')
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}
```

- [ ] **Step 3: Create server/migrate.ts**

Create `server/migrate.ts`:

```typescript
import fs from 'fs'
import path from 'path'
import { getDb } from './db'

export function runMigrations(): void {
  const db = getDb()

  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `)

  const migrationsDir = path.join(__dirname, 'migrations')
  // In dev (tsx), migrations are alongside source; in prod (compiled), copy them
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
```

- [ ] **Step 4: Test migration runs**

Create a quick smoke test by running:

```bash
npx tsx -e "
  const { runMigrations } = require('./server/migrate');
  const { getDb } = require('./server/db');
  runMigrations();
  const db = getDb();
  const tables = db.prepare(\"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name\").all();
  console.log('Tables:', tables.map((t: any) => t.name));
"
```

Expected output includes: `_migrations`, `facilities`, `sessions`, `tubs`, `users`

- [ ] **Step 5: Commit**

```bash
git add server/db.ts server/migrate.ts server/migrations/001_initial.sql
git commit -m "feat: add SQLite database layer with migrations"
```

---

### Task 3: Auth Middleware & Rate Limiter

**Files:**
- Create: `server/middleware/auth.ts`
- Create: `server/middleware/rateLimit.ts`

- [ ] **Step 1: Create server/middleware/rateLimit.ts**

Create `server/middleware/rateLimit.ts`:

```typescript
import type { Request, Response, NextFunction } from 'express'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key)
  }
}, 5 * 60 * 1000)

export function rateLimit(maxAttempts: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown'
    const now = Date.now()
    const entry = store.get(key)

    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs })
      next()
      return
    }

    entry.count++
    if (entry.count > maxAttempts) {
      res.status(429).json({ error: 'För många försök. Vänta en stund.' })
      return
    }

    next()
  }
}
```

- [ ] **Step 2: Create server/middleware/auth.ts**

Create `server/middleware/auth.ts`:

```typescript
import type { Request, Response, NextFunction } from 'express'
import { getDb } from '../db'

// Extend Express Request type
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
```

- [ ] **Step 3: Commit**

```bash
git add server/middleware/auth.ts server/middleware/rateLimit.ts
git commit -m "feat: add auth middleware and rate limiter"
```

---

### Task 4: Facilities Routes — Create, Join, Invite

**Files:**
- Create: `server/routes/facilities.ts`

- [ ] **Step 1: Create server/routes/facilities.ts**

Create `server/routes/facilities.ts`:

```typescript
import { Router } from 'express'
import crypto from 'crypto'
import bcryptjs from 'bcryptjs'
import { getDb } from '../db'
import { authMiddleware, adminOnly } from '../middleware/auth'

const router = Router()

function generateInviteCode(): string {
  return crypto.randomBytes(3).toString('hex').toUpperCase() // 6 chars, e.g. "A3F1B2"
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
```

- [ ] **Step 2: Commit**

```bash
git add server/routes/facilities.ts
git commit -m "feat: add facilities routes (create, join, invite)"
```

---

### Task 5: Auth Routes — Login, Logout, Me, Facilities List

**Files:**
- Create: `server/routes/auth.ts`

- [ ] **Step 1: Create server/routes/auth.ts**

Create `server/routes/auth.ts`:

```typescript
import { Router } from 'express'
import crypto from 'crypto'
import bcryptjs from 'bcryptjs'
import { getDb } from '../db'
import { authMiddleware } from '../middleware/auth'
import { rateLimit } from '../middleware/rateLimit'

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
```

- [ ] **Step 2: Commit**

```bash
git add server/routes/auth.ts
git commit -m "feat: add auth routes (login, logout, me, facility/user list)"
```

---

### Task 6: Tubs Routes — CRUD

**Files:**
- Create: `server/routes/tubs.ts`

- [ ] **Step 1: Create server/routes/tubs.ts**

Create `server/routes/tubs.ts`:

```typescript
import { Router } from 'express'
import crypto from 'crypto'
import { getDb } from '../db'
import { authMiddleware, adminOnly } from '../middleware/auth'

const router = Router()

// All routes require auth
router.use(authMiddleware)

// GET /api/tubs — List active tubs for the facility
router.get('/', (req, res) => {
  const db = getDb()
  const tubs = db.prepare(
    'SELECT id, name, volume, target_temp, sanitizer, created_at FROM tubs WHERE facility_id = ? AND archived = 0 ORDER BY name'
  ).all(req.facilityId)
  res.json(tubs)
})

// POST /api/tubs — Create tub (admin only)
router.post('/', adminOnly, (req, res) => {
  const { name, volume, targetTemp, sanitizer } = req.body

  if (!name?.trim() || !volume || typeof volume !== 'number' || volume <= 0) {
    res.status(400).json({ error: 'Namn och volym krävs.' })
    return
  }

  const san = sanitizer === 'bromine' ? 'bromine' : 'chlorine'
  const db = getDb()
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  db.prepare(
    'INSERT INTO tubs (id, facility_id, name, volume, target_temp, sanitizer, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, req.facilityId, name.trim(), volume, targetTemp ?? null, san, now)

  res.status(201).json({ id, name: name.trim(), volume, target_temp: targetTemp ?? null, sanitizer: san, created_at: now })
})

// PATCH /api/tubs/:id — Update tub (admin only)
router.patch('/:id', adminOnly, (req, res) => {
  const { name, volume, targetTemp, sanitizer } = req.body
  const db = getDb()

  const tub = db.prepare('SELECT id FROM tubs WHERE id = ? AND facility_id = ? AND archived = 0').get(
    req.params.id, req.facilityId
  )
  if (!tub) {
    res.status(404).json({ error: 'Badet hittades inte.' })
    return
  }

  const updates: string[] = []
  const values: unknown[] = []

  if (name?.trim()) { updates.push('name = ?'); values.push(name.trim()) }
  if (typeof volume === 'number' && volume > 0) { updates.push('volume = ?'); values.push(volume) }
  if (targetTemp !== undefined) { updates.push('target_temp = ?'); values.push(targetTemp) }
  if (sanitizer === 'chlorine' || sanitizer === 'bromine') { updates.push('sanitizer = ?'); values.push(sanitizer) }

  if (updates.length === 0) {
    res.status(400).json({ error: 'Inga fält att uppdatera.' })
    return
  }

  values.push(req.params.id, req.facilityId)
  db.prepare(`UPDATE tubs SET ${updates.join(', ')} WHERE id = ? AND facility_id = ?`).run(...values)

  const updated = db.prepare(
    'SELECT id, name, volume, target_temp, sanitizer, created_at FROM tubs WHERE id = ?'
  ).get(req.params.id)
  res.json(updated)
})

// DELETE /api/tubs/:id — Archive tub (admin only, soft delete)
router.delete('/:id', adminOnly, (req, res) => {
  const db = getDb()
  const result = db.prepare('UPDATE tubs SET archived = 1 WHERE id = ? AND facility_id = ? AND archived = 0').run(
    req.params.id, req.facilityId
  )
  if (result.changes === 0) {
    res.status(404).json({ error: 'Badet hittades inte.' })
    return
  }
  res.json({ ok: true })
})

export default router
```

- [ ] **Step 2: Commit**

```bash
git add server/routes/tubs.ts
git commit -m "feat: add tubs routes (list, create, update, archive)"
```

---

### Task 7: Users Routes — List, Delete, Role

**Files:**
- Create: `server/routes/users.ts`

- [ ] **Step 1: Create server/routes/users.ts**

Create `server/routes/users.ts`:

```typescript
import { Router } from 'express'
import { getDb } from '../db'
import { authMiddleware, adminOnly } from '../middleware/auth'

const router = Router()

// All routes require auth
router.use(authMiddleware)

// GET /api/users — List users in facility
router.get('/', (req, res) => {
  const db = getDb()
  const users = db.prepare(
    'SELECT id, name, role, created_at FROM users WHERE facility_id = ? ORDER BY name'
  ).all(req.facilityId)
  res.json(users)
})

// DELETE /api/users/:id — Remove user (admin only)
router.delete('/:id', adminOnly, (req, res) => {
  if (req.params.id === req.user!.id) {
    res.status(400).json({ error: 'Du kan inte ta bort dig själv.' })
    return
  }

  const db = getDb()
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(req.params.id)
    const result = db.prepare('DELETE FROM users WHERE id = ? AND facility_id = ?').run(
      req.params.id, req.facilityId
    )
    return result.changes
  })

  const changes = tx()
  if (changes === 0) {
    res.status(404).json({ error: 'Användaren hittades inte.' })
    return
  }
  res.json({ ok: true })
})

// PATCH /api/users/:id/role — Change role (admin only)
router.patch('/:id/role', adminOnly, (req, res) => {
  const { role } = req.body

  if (role !== 'admin' && role !== 'staff') {
    res.status(400).json({ error: 'Roll måste vara admin eller staff.' })
    return
  }
  if (req.params.id === req.user!.id) {
    res.status(400).json({ error: 'Du kan inte ändra din egen roll.' })
    return
  }

  const db = getDb()
  const result = db.prepare('UPDATE users SET role = ? WHERE id = ? AND facility_id = ?').run(
    role, req.params.id, req.facilityId
  )
  if (result.changes === 0) {
    res.status(404).json({ error: 'Användaren hittades inte.' })
    return
  }
  res.json({ ok: true })
})

export default router
```

- [ ] **Step 2: Commit**

```bash
git add server/routes/users.ts
git commit -m "feat: add users routes (list, delete, change role)"
```

---

### Task 8: Express Server Entry Point

**Files:**
- Create: `server/index.ts`

- [ ] **Step 1: Create server/index.ts**

Create `server/index.ts`:

```typescript
import express from 'express'
import cors from 'cors'
import path from 'path'
import { runMigrations } from './migrate'
import facilitiesRouter from './routes/facilities'
import authRouter from './routes/auth'
import tubsRouter from './routes/tubs'
import usersRouter from './routes/users'

const app = express()
const PORT = parseInt(process.env.PORT || '3000', 10)

// Run migrations before starting
runMigrations()

// Middleware
app.use(cors())
app.use(express.json())

// API routes
app.use('/api/facilities', facilitiesRouter)
app.use('/api/auth', authRouter)
app.use('/api/tubs', tubsRouter)
app.use('/api/users', usersRouter)

// Serve static frontend in production
const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))

// SPA fallback — serve index.html for all non-API routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`AquaCare server running on port ${PORT}`)
})
```

- [ ] **Step 2: Test server starts**

```bash
npx tsx server/index.ts &
sleep 1
curl -s http://localhost:3000/api/auth/facilities | head
kill %1
```

Expected: `[]` (empty array — no facilities yet).

- [ ] **Step 3: Test creating a facility**

```bash
npx tsx server/index.ts &
sleep 1
curl -s -X POST http://localhost:3000/api/facilities \
  -H "Content-Type: application/json" \
  -d '{"facilityName":"Testbadet","userName":"Admin","pin":"1234"}' | python3 -m json.tool
kill %1
```

Expected: JSON with `token`, `user`, `facility`, `inviteCode`.

- [ ] **Step 4: Commit**

```bash
git add server/index.ts
git commit -m "feat: add Express server entry point wiring all routes"
```

---

### Task 9: Frontend API Client

**Files:**
- Create: `src/lib/api.ts`

- [ ] **Step 1: Create src/lib/api.ts**

Create `src/lib/api.ts`:

```typescript
const API_BASE = '/api'

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('aquacare_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Okänt fel' }))
    throw new ApiError(res.status, body.error || 'Okänt fel')
  }

  return res.json()
}

// Auth
export const api = {
  // Public
  createFacility: (data: { facilityName: string; userName: string; pin: string }) =>
    request<{ token: string; user: { id: string; name: string; role: string }; facility: { id: string; name: string }; inviteCode: string }>(
      '/facilities', { method: 'POST', body: JSON.stringify(data) }
    ),

  joinFacility: (data: { inviteCode: string; userName: string; pin: string }) =>
    request<{ token: string; user: { id: string; name: string; role: string }; facility: { id: string; name: string } }>(
      '/facilities/join', { method: 'POST', body: JSON.stringify(data) }
    ),

  listFacilities: () =>
    request<{ id: string; name: string }[]>('/auth/facilities'),

  listFacilityUsers: (facilityId: string) =>
    request<{ id: string; name: string }[]>(`/auth/facilities/${facilityId}/users`),

  login: (data: { facilityId: string; userId: string; pin: string }) =>
    request<{ token: string; user: { id: string; name: string; role: string }; facility: { id: string; name: string } }>(
      '/auth/login', { method: 'POST', body: JSON.stringify(data) }
    ),

  logout: () =>
    request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),

  me: () =>
    request<{ user: { id: string; name: string; role: string }; facility: { id: string; name: string } }>('/auth/me'),

  // Tubs
  listTubs: () =>
    request<{ id: string; name: string; volume: number; target_temp: number | null; sanitizer: string; created_at: string }[]>('/tubs'),

  createTub: (data: { name: string; volume: number; targetTemp?: number; sanitizer?: string }) =>
    request<{ id: string; name: string; volume: number; target_temp: number | null; sanitizer: string; created_at: string }>(
      '/tubs', { method: 'POST', body: JSON.stringify(data) }
    ),

  updateTub: (id: string, data: { name?: string; volume?: number; targetTemp?: number; sanitizer?: string }) =>
    request<{ id: string; name: string; volume: number; target_temp: number | null; sanitizer: string; created_at: string }>(
      `/tubs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }
    ),

  deleteTub: (id: string) =>
    request<{ ok: boolean }>(`/tubs/${id}`, { method: 'DELETE' }),

  // Users
  listUsers: () =>
    request<{ id: string; name: string; role: string; created_at: string }[]>('/users'),

  deleteUser: (id: string) =>
    request<{ ok: boolean }>(`/users/${id}`, { method: 'DELETE' }),

  changeUserRole: (id: string, role: 'admin' | 'staff') =>
    request<{ ok: boolean }>(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),

  // Invite
  getInviteCode: () =>
    request<{ inviteCode: string }>('/facilities/invite'),

  regenerateInviteCode: () =>
    request<{ inviteCode: string }>('/facilities/invite', { method: 'POST' }),
}

export { ApiError }
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: add API client module with typed fetch wrapper"
```

---

### Task 10: AuthProvider Context + ProtectedRoute

**Files:**
- Create: `src/contexts/AuthContext.tsx`

- [ ] **Step 1: Create src/contexts/AuthContext.tsx**

Create `src/contexts/AuthContext.tsx`:

```tsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api'

interface AuthUser {
  id: string
  name: string
  role: string
}

interface AuthFacility {
  id: string
  name: string
}

interface AuthContextValue {
  user: AuthUser | null
  facility: AuthFacility | null
  token: string | null
  isAdmin: boolean
  loading: boolean
  setSession: (token: string, user: AuthUser, facility: AuthFacility) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [facility, setFacility] = useState<AuthFacility | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('aquacare_token'))
  const [loading, setLoading] = useState(!!localStorage.getItem('aquacare_token'))

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    api.me()
      .then((data) => {
        setUser(data.user)
        setFacility(data.facility)
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          localStorage.removeItem('aquacare_token')
          setToken(null)
        }
      })
      .finally(() => setLoading(false))
  }, [token])

  const setSession = useCallback((newToken: string, newUser: AuthUser, newFacility: AuthFacility) => {
    localStorage.setItem('aquacare_token', newToken)
    setToken(newToken)
    setUser(newUser)
    setFacility(newFacility)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } catch {
      // Ignore errors — token might already be invalid
    }
    localStorage.removeItem('aquacare_token')
    setToken(null)
    setUser(null)
    setFacility(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, facility, token, isAdmin: user?.role === 'admin', loading, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !token) {
      navigate('/valkom', { replace: true })
    }
  }, [loading, token, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!token) return null

  return <>{children}</>
}
```

- [ ] **Step 2: Commit**

```bash
git add src/contexts/AuthContext.tsx
git commit -m "feat: add AuthProvider context with useAuth and ProtectedRoute"
```

---

### Task 11: Auth Pages — Welcome, Create, Join, Login

**Files:**
- Create: `src/pages/Welcome.tsx`
- Create: `src/pages/CreateFacility.tsx`
- Create: `src/pages/JoinFacility.tsx`
- Create: `src/pages/Login.tsx`

- [ ] **Step 1: Create src/pages/Welcome.tsx**

Create `src/pages/Welcome.tsx`:

```tsx
import { Link } from 'react-router-dom'
import { Droplets, Plus, KeyRound, LogIn } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'

export default function Welcome() {
  return (
    <div className="p-5 flex flex-col items-center justify-center min-h-dvh safe-area-pt">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 mb-4">
            <Droplets size={32} className="text-gold" />
          </div>
          <h1 className="font-display text-3xl text-gold tracking-[3px] font-bold">AquaCare</h1>
          <p className="text-sm text-slate-400 mt-2">Professionell vattenkontroll</p>
        </div>

        <div className="space-y-3">
          <Link to="/skapa">
            <GlassCard className="flex items-center gap-3 active:scale-[0.98] transition-transform duration-200">
              <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                <Plus size={20} className="text-gold" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-200">Skapa anläggning</div>
                <div className="text-xs text-slate-400">Ny anläggning med dig som admin</div>
              </div>
            </GlassCard>
          </Link>

          <Link to="/join">
            <GlassCard className="flex items-center gap-3 active:scale-[0.98] transition-transform duration-200 mt-3">
              <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                <KeyRound size={20} className="text-gold" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-200">Jag har en kod</div>
                <div className="text-xs text-slate-400">Gå med i en befintlig anläggning</div>
              </div>
            </GlassCard>
          </Link>

          <Link to="/login">
            <GlassCard className="flex items-center gap-3 active:scale-[0.98] transition-transform duration-200 mt-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                <LogIn size={20} className="text-slate-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-200">Logga in</div>
                <div className="text-xs text-slate-400">Jag har redan ett konto</div>
              </div>
            </GlassCard>
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create src/pages/CreateFacility.tsx**

Create `src/pages/CreateFacility.tsx`:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2 } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

export default function CreateFacility() {
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const [facilityName, setFacilityName] = useState('')
  const [userName, setUserName] = useState('')
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!facilityName.trim() || !userName.trim()) {
      setError('Alla fält krävs.')
      return
    }
    if (!/^\d{4}$/.test(pin)) {
      setError('PIN måste vara 4 siffror.')
      return
    }
    if (pin !== pinConfirm) {
      setError('PIN-koderna matchar inte.')
      return
    }

    setLoading(true)
    try {
      const data = await api.createFacility({ facilityName: facilityName.trim(), userName: userName.trim(), pin })
      setSession(data.token, data.user, data.facility)
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Något gick fel.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-5 min-h-dvh safe-area-pt">
      <div className="max-w-sm mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/valkom')} className="min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Tillbaka">
            <ArrowLeft size={20} className="text-slate-400" />
          </button>
          <h1 className="font-display text-xl text-gold font-bold">Skapa anläggning</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <GlassCard>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Anläggningsnamn</label>
                <input
                  type="text"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  placeholder="T.ex. Strandbadet Spa"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-colors duration-200"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Ditt namn</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="T.ex. Anna K"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-colors duration-200"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Välj PIN-kod (4 siffror)</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 text-center tracking-[8px] placeholder:tracking-[4px] placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-colors duration-200"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Bekräfta PIN-kod</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 text-center tracking-[8px] placeholder:tracking-[4px] placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-colors duration-200"
                />
              </div>
            </div>
          </GlassCard>

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full min-h-[48px] bg-gradient-to-br from-gold to-gold-dark text-navy rounded-[14px] font-bold text-[15px] tracking-wide shadow-[0_4px_16px_rgba(232,201,122,0.2)] transition-transform duration-200 active:scale-[0.98] disabled:opacity-50"
          >
            <Building2 size={18} strokeWidth={2.5} />
            {loading ? 'Skapar...' : 'Skapa anläggning'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create src/pages/JoinFacility.tsx**

Create `src/pages/JoinFacility.tsx`:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, KeyRound } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

export default function JoinFacility() {
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const [inviteCode, setInviteCode] = useState('')
  const [userName, setUserName] = useState('')
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!inviteCode.trim() || !userName.trim()) {
      setError('Alla fält krävs.')
      return
    }
    if (!/^\d{4}$/.test(pin)) {
      setError('PIN måste vara 4 siffror.')
      return
    }
    if (pin !== pinConfirm) {
      setError('PIN-koderna matchar inte.')
      return
    }

    setLoading(true)
    try {
      const data = await api.joinFacility({ inviteCode: inviteCode.trim(), userName: userName.trim(), pin })
      setSession(data.token, data.user, data.facility)
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Något gick fel.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-5 min-h-dvh safe-area-pt">
      <div className="max-w-sm mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/valkom')} className="min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Tillbaka">
            <ArrowLeft size={20} className="text-slate-400" />
          </button>
          <h1 className="font-display text-xl text-gold font-bold">Gå med</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <GlassCard>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Inbjudningskod</label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="T.ex. A3F1B2"
                  maxLength={6}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 text-center tracking-[6px] uppercase placeholder:tracking-[2px] placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-colors duration-200"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Ditt namn</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="T.ex. Erik S"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-colors duration-200"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Välj PIN-kod (4 siffror)</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 text-center tracking-[8px] placeholder:tracking-[4px] placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-colors duration-200"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Bekräfta PIN-kod</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 text-center tracking-[8px] placeholder:tracking-[4px] placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-colors duration-200"
                />
              </div>
            </div>
          </GlassCard>

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full min-h-[48px] bg-gradient-to-br from-gold to-gold-dark text-navy rounded-[14px] font-bold text-[15px] tracking-wide shadow-[0_4px_16px_rgba(232,201,122,0.2)] transition-transform duration-200 active:scale-[0.98] disabled:opacity-50"
          >
            <KeyRound size={18} strokeWidth={2.5} />
            {loading ? 'Ansluter...' : 'Gå med'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create src/pages/Login.tsx**

Create `src/pages/Login.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, LogIn, ChevronRight } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

type Step = 'facility' | 'user' | 'pin'

export default function Login() {
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const [step, setStep] = useState<Step>('facility')
  const [facilities, setFacilities] = useState<{ id: string; name: string }[]>([])
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [selectedFacility, setSelectedFacility] = useState<{ id: string; name: string } | null>(null)
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.listFacilities().then(setFacilities).catch(() => {})
  }, [])

  function selectFacility(f: { id: string; name: string }) {
    setSelectedFacility(f)
    setStep('user')
    setError('')
    api.listFacilityUsers(f.id).then(setUsers).catch(() => {})
  }

  function selectUser(u: { id: string; name: string }) {
    setSelectedUser(u)
    setStep('pin')
    setError('')
    setPin('')
  }

  function goBack() {
    if (step === 'pin') { setStep('user'); setPin(''); setError('') }
    else if (step === 'user') { setStep('facility'); setError('') }
    else navigate('/valkom')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFacility || !selectedUser) return
    setError('')

    if (!/^\d{4}$/.test(pin)) {
      setError('PIN måste vara 4 siffror.')
      return
    }

    setLoading(true)
    try {
      const data = await api.login({ facilityId: selectedFacility.id, userId: selectedUser.id, pin })
      setSession(data.token, data.user, data.facility)
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Felaktig PIN.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-5 min-h-dvh safe-area-pt">
      <div className="max-w-sm mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Tillbaka">
            <ArrowLeft size={20} className="text-slate-400" />
          </button>
          <h1 className="font-display text-xl text-gold font-bold">
            {step === 'facility' ? 'Välj anläggning' : step === 'user' ? 'Välj ditt namn' : 'Ange PIN'}
          </h1>
        </div>

        {step === 'facility' && (
          <div className="space-y-2">
            {facilities.length === 0 ? (
              <GlassCard className="text-center py-6">
                <p className="text-sm text-slate-400">Inga anläggningar hittades</p>
              </GlassCard>
            ) : (
              facilities.map((f) => (
                <button key={f.id} onClick={() => selectFacility(f)} className="w-full text-left">
                  <GlassCard className="flex items-center justify-between active:scale-[0.98] transition-transform duration-200">
                    <span className="text-sm font-semibold text-slate-200">{f.name}</span>
                    <ChevronRight size={16} className="text-slate-500" />
                  </GlassCard>
                </button>
              ))
            )}
          </div>
        )}

        {step === 'user' && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">{selectedFacility?.name}</p>
            {users.length === 0 ? (
              <GlassCard className="text-center py-6">
                <p className="text-sm text-slate-400">Inga användare hittades</p>
              </GlassCard>
            ) : (
              users.map((u) => (
                <button key={u.id} onClick={() => selectUser(u)} className="w-full text-left">
                  <GlassCard className="flex items-center justify-between active:scale-[0.98] transition-transform duration-200">
                    <span className="text-sm font-semibold text-slate-200">{u.name}</span>
                    <ChevronRight size={16} className="text-slate-500" />
                  </GlassCard>
                </button>
              ))
            )}
          </div>
        )}

        {step === 'pin' && (
          <form onSubmit={handleLogin} className="space-y-3">
            <p className="text-xs text-slate-500">{selectedFacility?.name} — {selectedUser?.name}</p>
            <GlassCard>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">PIN-kod</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 text-center tracking-[8px] placeholder:tracking-[4px] placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-colors duration-200"
                autoFocus
              />
            </GlassCard>

            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full min-h-[48px] bg-gradient-to-br from-gold to-gold-dark text-navy rounded-[14px] font-bold text-[15px] tracking-wide shadow-[0_4px_16px_rgba(232,201,122,0.2)] transition-transform duration-200 active:scale-[0.98] disabled:opacity-50"
            >
              <LogIn size={18} strokeWidth={2.5} />
              {loading ? 'Loggar in...' : 'Logga in'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/Welcome.tsx src/pages/CreateFacility.tsx src/pages/JoinFacility.tsx src/pages/Login.tsx
git commit -m "feat: add auth pages (welcome, create facility, join, login)"
```

---

### Task 12: Wire Auth Into App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update src/App.tsx**

Replace the entire content of `src/App.tsx` with:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, ProtectedRoute } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import Dashboard from './pages/Dashboard'
import Schedule from './pages/Schedule'
import WaterLog from './pages/WaterLog'
import WaterLogForm from './pages/WaterLogForm'
import Calculator from './pages/Calculator'
import Notes from './pages/Notes'
import Settings from './pages/Settings'
import Welcome from './pages/Welcome'
import CreateFacility from './pages/CreateFacility'
import JoinFacility from './pages/JoinFacility'
import Login from './pages/Login'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public auth routes */}
          <Route path="valkom" element={<Welcome />} />
          <Route path="skapa" element={<CreateFacility />} />
          <Route path="join" element={<JoinFacility />} />
          <Route path="login" element={<Login />} />

          {/* Protected app routes */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="schema" element={<Schedule />} />
            <Route path="logg" element={<WaterLog />} />
            <Route path="logg/ny" element={<WaterLogForm />} />
            <Route path="logg/redigera/:id" element={<WaterLogForm />} />
            <Route path="kalkyl" element={<Calculator />} />
            <Route path="noteringar" element={<Notes />} />
            <Route path="installningar" element={<Settings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
```

- [ ] **Step 2: Verify frontend compiles**

```bash
npx tsc -b && npx vite build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire auth into routing with protected routes"
```

---

### Task 13: Update Settings Page — User Info, Logout, Admin Panel

**Files:**
- Modify: `src/pages/Settings.tsx`

- [ ] **Step 1: Replace src/pages/Settings.tsx**

Replace the entire content of `src/pages/Settings.tsx` with:

```tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, LogOut, Users, Copy, RefreshCw, Shield, Trash2 } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useSettings } from '../hooks/useSettings'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { formatSwedishDecimal } from '../constants'

export default function Settings() {
  const navigate = useNavigate()
  const { settings, updateSettings } = useSettings()
  const { user, facility, isAdmin, logout } = useAuth()
  const [spaName, setSpaName] = useState(settings.spaName)
  const [volume, setVolume] = useState(String(settings.waterVolume))
  const [cycleDays, setCycleDays] = useState(String(settings.waterChangeCycleDays))
  const [saved, setSaved] = useState(false)

  // Admin state
  const [inviteCode, setInviteCode] = useState('')
  const [users, setUsers] = useState<{ id: string; name: string; role: string; created_at: string }[]>([])
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [codeCopied, setCodeCopied] = useState(false)

  useEffect(() => {
    if (isAdmin) {
      api.getInviteCode().then((d) => setInviteCode(d.inviteCode)).catch(() => {})
      api.listUsers().then(setUsers).catch(() => {})
    }
  }, [isAdmin])

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const vol = Number(volume)
    const days = Number(cycleDays)
    if (!spaName.trim() || isNaN(vol) || vol <= 0 || isNaN(days) || days <= 0) return
    updateSettings({ spaName: spaName.trim(), waterVolume: vol, waterChangeCycleDays: days })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleLogout() {
    await logout()
    navigate('/valkom', { replace: true })
  }

  async function handleRegenerateCode() {
    const data = await api.regenerateInviteCode()
    setInviteCode(data.inviteCode)
  }

  function copyCode() {
    navigator.clipboard.writeText(inviteCode)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  async function handleDeleteUser(id: string) {
    await api.deleteUser(id)
    setUsers((prev) => prev.filter((u) => u.id !== id))
    setDeleteUserId(null)
  }

  async function handleToggleRole(id: string, currentRole: string) {
    const newRole = currentRole === 'admin' ? 'staff' : 'admin'
    await api.changeUserRole(id, newRole as 'admin' | 'staff')
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)))
  }

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Tillbaka">
          <ArrowLeft size={20} className="text-slate-400" />
        </button>
        <h1 className="font-display text-xl text-gold font-bold">Inställningar</h1>
      </div>

      {/* User info */}
      <GlassCard>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-200">{user?.name}</div>
            <div className="text-xs text-slate-400">{facility?.name} — {user?.role === 'admin' ? 'Admin' : 'Personal'}</div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 min-h-[44px] px-3 text-red-400 text-sm font-medium"
          >
            <LogOut size={16} />
            Logga ut
          </button>
        </div>
      </GlassCard>

      {/* Local settings */}
      <form onSubmit={handleSave} className="space-y-3">
        <div className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">Lokala inställningar</div>
        <GlassCard>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Spa-namn</label>
              <input type="text" value={spaName} onChange={(e) => setSpaName(e.target.value)} placeholder="MSpa Bristol Urban" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-colors duration-200" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Vattenvolym (liter)</label>
              <input type="text" inputMode="numeric" value={volume} onChange={(e) => setVolume(e.target.value)} placeholder="1000" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-colors duration-200" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Vattenbytescykel (dagar)</label>
              <input type="text" inputMode="numeric" value={cycleDays} onChange={(e) => setCycleDays(e.target.value)} placeholder="90" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] text-base text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-colors duration-200" />
              <span className="text-[11px] text-slate-500 mt-1 block">Nuvarande cykel: {formatSwedishDecimal(settings.waterChangeCycleDays)} dagar</span>
            </div>
          </div>
        </GlassCard>
        <button type="submit" className="flex items-center justify-center gap-2 w-full min-h-[48px] bg-gradient-to-br from-gold to-gold-dark text-navy rounded-[14px] font-bold text-[15px] tracking-wide shadow-[0_4px_16px_rgba(232,201,122,0.2)] transition-transform duration-200 active:scale-[0.98]">
          <Save size={18} strokeWidth={2.5} />
          {saved ? 'Sparat!' : 'Spara inställningar'}
        </button>
      </form>

      {/* Admin section */}
      {isAdmin && (
        <>
          <div className="text-[11px] text-slate-500 uppercase tracking-wider font-medium pt-2">Administration</div>

          {/* Invite code */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-2">
              <Users size={14} className="text-gold" />
              <span className="text-xs text-gold font-semibold uppercase tracking-wider">Inbjudningskod</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 min-h-[48px] flex items-center text-lg font-mono text-slate-200 tracking-[4px]">
                {inviteCode}
              </div>
              <button onClick={copyCode} className="min-w-[48px] min-h-[48px] flex items-center justify-center bg-white/5 border border-white/10 rounded-xl" aria-label="Kopiera">
                <Copy size={16} className={codeCopied ? 'text-status-ok' : 'text-slate-400'} />
              </button>
              <button onClick={handleRegenerateCode} className="min-w-[48px] min-h-[48px] flex items-center justify-center bg-white/5 border border-white/10 rounded-xl" aria-label="Generera ny kod">
                <RefreshCw size={16} className="text-slate-400" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Dela koden med personal som ska gå med i anläggningen.</p>
          </GlassCard>

          {/* User list */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-3">
              <Users size={14} className="text-gold" />
              <span className="text-xs text-gold font-semibold uppercase tracking-wider">Personal ({users.length})</span>
            </div>
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-1">
                  <div>
                    <span className="text-sm text-slate-200">{u.name}</span>
                    <span className="text-[10px] text-slate-500 ml-2">{u.role === 'admin' ? 'Admin' : 'Personal'}</span>
                  </div>
                  {u.id !== user?.id && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleToggleRole(u.id, u.role)} className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg" aria-label="Ändra roll">
                        <Shield size={14} className="text-slate-600" />
                      </button>
                      <button onClick={() => setDeleteUserId(u.id)} className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg" aria-label="Ta bort">
                        <Trash2 size={14} className="text-slate-600" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        </>
      )}

      {deleteUserId && (
        <ConfirmDialog
          title="Ta bort användare"
          message="Vill du verkligen ta bort denna användare? Deras sessioner invalideras direkt."
          onConfirm={() => handleDeleteUser(deleteUserId)}
          onCancel={() => setDeleteUserId(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Settings.tsx
git commit -m "feat: update settings with user info, logout, admin invite and user management"
```

---

### Task 14: Update Dockerfile & docker-compose

**Files:**
- Modify: `Dockerfile`
- Modify: `docker-compose.yml`

- [ ] **Step 1: Replace Dockerfile**

Replace the entire content of `Dockerfile` with:

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm run build:server

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/server-dist ./server-dist
COPY --from=build /app/server/migrations ./server-dist/migrations
COPY --from=build /app/package.json ./
COPY --from=build /app/package-lock.json ./
RUN npm ci --omit=dev
RUN mkdir -p /app/data
EXPOSE 3000
CMD ["node", "server-dist/index.js"]
```

- [ ] **Step 2: Replace docker-compose.yml**

Replace the entire content of `docker-compose.yml` with:

```yaml
services:
  aquacare:
    image: ghcr.io/antonk123/aquacare:latest
    container_name: aquacare
    restart: unless-stopped
    ports:
      - "3010:3000"
    volumes:
      - ./data:/app/data
```

- [ ] **Step 3: Update GitHub Actions build (no changes needed)**

The existing `.github/workflows/build.yml` builds the Dockerfile and pushes to GHCR. No changes needed — the new Dockerfile replaces the old one.

- [ ] **Step 4: Verify full build locally**

```bash
npm run build && npm run build:server
ls dist/index.html server-dist/index.js
```

Expected: Both files exist.

- [ ] **Step 5: Commit**

```bash
git add Dockerfile docker-compose.yml
git commit -m "feat: update Dockerfile to build server + frontend, switch from Nginx to Express"
```

---

### Task 15: Smoke Test — Full Flow

- [ ] **Step 1: Start server in dev mode**

In one terminal:
```bash
npx tsx server/index.ts
```

In another terminal:
```bash
npm run dev
```

- [ ] **Step 2: Test create facility**

```bash
curl -s -X POST http://localhost:3000/api/facilities \
  -H "Content-Type: application/json" \
  -d '{"facilityName":"Testbadet","userName":"Admin","pin":"1234"}'
```

Save the `token` and `inviteCode` from the response.

- [ ] **Step 3: Test join facility**

```bash
curl -s -X POST http://localhost:3000/api/facilities/join \
  -H "Content-Type: application/json" \
  -d '{"inviteCode":"<CODE>","userName":"Personal 1","pin":"5678"}'
```

- [ ] **Step 4: Test login**

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"facilityId":"<FACILITY_ID>","userId":"<USER_ID>","pin":"1234"}'
```

- [ ] **Step 5: Test tub CRUD**

```bash
TOKEN="<ADMIN_TOKEN>"

# Create tub
curl -s -X POST http://localhost:3000/api/tubs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Relaxbad 1","volume":1000}'

# List tubs
curl -s http://localhost:3000/api/tubs \
  -H "Authorization: Bearer $TOKEN"
```

- [ ] **Step 6: Test frontend auth flow in browser**

Open `http://localhost:5173/valkom` (Vite dev server).

1. Click "Skapa anläggning" → fill form → should redirect to dashboard
2. Open settings → verify user name, facility name, invite code visible
3. Open incognito → go to `/join` → enter invite code → should create staff user

- [ ] **Step 7: Clean up test data**

```bash
rm -f data/aquacare.db
```

- [ ] **Step 8: Commit any fixes**

If any issues were found during testing, fix them and commit:

```bash
git add -A
git commit -m "fix: address issues found during smoke test"
```

- [ ] **Step 9: Final commit and push**

```bash
git push
```
