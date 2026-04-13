# Fas 1: Backend + Auth — Design Spec

> AquaCare Pro: från personlig spa-app till professionell badvattenplattform.

## Bakgrund

AquaCare är idag en client-only React-app med localStorage. För att stödja flera användare på samma anläggning (4-5 personer som kontrollerar spabad dagligen) behövs en backend med auth, databaslagring och fleranvändarstöd.

Fas 1 bygger grunden: Express-server, SQLite-databas, PIN-baserad auth med inbjudningslänkar, och datamodell för anläggningar/bad/användare.

## Beslut tagna under brainstorming

| Beslut | Val | Motivering |
|--------|-----|------------|
| Målgrupp | Alla storlekar (BRF → spahotell) | Flexibel modell som skalas |
| Auth | Inbjudningslänkar + namn + PIN | Låg friktion, våta händer, individuell spårbarhet |
| Bad-organisation | Platt lista (grupper senare) | 90% har <10 bad, gruppering kan läggas till utan datamodellsändring |
| Missade uppgifter | Visuell markering | Push-notiser och eskalering i senare fas |
| Backend | Node/Express + SQLite | Full kontroll, self-hostable, en container, WAL-mode för concurrent access |
| Rapporter | Logghistorik + trender + sammanfattningar | PDF-rapporter i senare fas |

## Datamodell

Fyra tabeller i SQLite:

### facilities

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| id | TEXT PK | UUID |
| name | TEXT NOT NULL | Anläggningsnamn |
| created_at | TEXT NOT NULL | ISO datetime |
| invite_code | TEXT UNIQUE NOT NULL | 6 alfanumeriska tecken |

### users

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| id | TEXT PK | UUID |
| facility_id | TEXT FK → facilities | Anläggning |
| name | TEXT NOT NULL | Visningsnamn |
| pin_hash | TEXT NOT NULL | bcrypt-hashad PIN |
| role | TEXT NOT NULL | 'admin' eller 'staff' |
| created_at | TEXT NOT NULL | ISO datetime |

### tubs

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| id | TEXT PK | UUID |
| facility_id | TEXT FK → facilities | Anläggning |
| name | TEXT NOT NULL | "Relaxbad 1" |
| volume | INTEGER NOT NULL | Liter |
| target_temp | REAL | °C, valfritt |
| sanitizer | TEXT DEFAULT 'chlorine' | 'chlorine' eller 'bromine' |
| created_at | TEXT NOT NULL | ISO datetime |
| archived | INTEGER DEFAULT 0 | Soft delete |

### sessions

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| id | TEXT PK | Auth-token |
| user_id | TEXT FK → users | Användare |
| created_at | TEXT NOT NULL | ISO datetime |
| expires_at | TEXT NOT NULL | 30 dagars livstid |

## Auth-flöden

### 1. Skapa anläggning

```
POST /api/facilities
Body: { facilityName, userName, pin }
→ Skapar: facility + user (admin) + session
→ Svar: { token, user, facility, inviteCode }
```

### 2. Gå med via inbjudningskod

```
POST /api/facilities/join
Body: { inviteCode, userName, pin }
→ Validerar kod → skapar user (staff) + session
→ Svar: { token, user, facility }
```

### 3. Logga in

```
POST /api/auth/login
Body: { facilityId, userId, pin }
→ Validerar PIN → skapar session
→ Svar: { token, user, facility }
```

### Token-hantering

- Sparas i localStorage som `aquacare_token`
- Skickas som `Authorization: Bearer <token>`
- 30 dagars livstid
- Utgånget token → redirect till /login

### Säkerhet

- PIN hashas med bcrypt
- Inbjudningskod: 6 alfanumeriska tecken, kan regenereras av admin
- Rate limiting: max 5 misslyckade PIN-försök per 15 min per user
- Inga känsliga personuppgifter lagras

## API-routes

### Publika (ingen auth)

```
POST   /api/facilities          — Skapa anläggning
POST   /api/facilities/join     — Gå med via kod
GET    /api/auth/facilities     — Lista anläggningar (bara id + namn, för login-skärmen)
GET    /api/auth/facilities/:id/users — Lista användare i anläggning (bara id + namn)
POST   /api/auth/login          — Logga in
```

`GET /auth/facilities` och `/auth/facilities/:id/users` returnerar bara id och namn — ingen känslig data. Behövs för att login-skärmen ska kunna visa "Välj anläggning → välj ditt namn".

### Autentiserade

```
POST   /api/auth/logout         — Invalidera session
GET    /api/auth/me             — Hämta inloggad user + facility
```

### Autentiserade + facility-scopade

```
GET    /api/tubs                — Lista bad
POST   /api/tubs                — Skapa bad (admin)
PATCH  /api/tubs/:id            — Uppdatera bad (admin)
DELETE /api/tubs/:id            — Arkivera bad (admin)
GET    /api/users               — Lista personal
DELETE /api/users/:id           — Ta bort personal (admin)
PATCH  /api/users/:id/role      — Ändra roll (admin)
GET    /api/facilities/invite   — Visa inbjudningskod (admin)
POST   /api/facilities/invite   — Regenerera kod (admin)
```

### Middleware-stack

```
cors → rateLimiter → authMiddleware → facilityScope → route handler
```

`facilityScope` injicerar `req.facilityId` från sessionen. Alla data-routes filtrerar automatiskt på anläggning.

## Projektstruktur

```
aquacare/
├── src/                        — React-frontend
├── server/
│   ├── index.ts                — Express setup, middleware, statisk filservering
│   ├── db.ts                   — SQLite-anslutning, WAL-mode
│   ├── migrate.ts              — Kör migrations vid uppstart
│   ├── middleware/
│   │   ├── auth.ts             — Token-validering → req.user
│   │   ├── facilityScope.ts    — req.facilityId från session
│   │   └── rateLimit.ts        — In-memory rate limiter
│   ├── routes/
│   │   ├── facilities.ts       — Skapa, join, invite
│   │   ├── auth.ts             — Login, logout, me
│   │   ├── tubs.ts             — CRUD bad
│   │   └── users.ts            — Lista, ta bort, ändra roll
│   └── migrations/
│       └── 001_initial.sql     — Alla 4 tabeller
├── Dockerfile                  — Bygger server + frontend, en container
└── docker-compose.yml          — SQLite-volym mountad
```

## Deployment

Express serverar:
- Statiska filer från `dist/` (frontend)
- API på `/api/*`

En container, en port (3000). Nginx behövs inte längre.

SQLite-filen mountas som Docker-volym: `./data/aquacare.db:/app/data/aquacare.db`

Migrations körs automatiskt vid serverstart.

### Nya beroenden

- `express` + `cors` — HTTP-server
- `better-sqlite3` — SQLite-driver (synkron, snabb)
- `bcrypt` — PIN-hashning
- `tsx` — TypeScript-kompilering (dev)

## Frontend-ändringar (minimalt skal)

### Nya sidor

| Route | Syfte |
|-------|-------|
| /valkom | Landning: "Skapa anläggning" eller "Jag har en kod" |
| /skapa | Formulär: anläggningsnamn, namn, PIN |
| /join | Formulär: inbjudningskod, namn, PIN |
| /login | Välj anläggning → namn → PIN |

### Auth-infrastruktur

- `AuthProvider` context med token, user, facility
- `useAuth()` hook: `{ user, facility, token, login, logout, isAdmin }`
- `ProtectedRoute` wrapper → redirect till /login utan token
- `api.ts` klientmodul med automatisk Authorization-header

### Befintliga sidor

Inga ändringar. Dashboard, logg, schema, kalkylator kör fortfarande localStorage. Migrering till API sker i fas 2.

### Navigationstillägg

- Användarnamn + anläggningsnamn i settings
- Logga ut-knapp i inställningar
- Admin: inbjudningskod + personalhantering i inställningar

## Vad fas 1 ger

Efter fas 1 kan man:
1. Skapa en anläggning och logga in
2. Bjuda in personal via inbjudningskod
3. Skapa och hantera bad
4. Se vilka som har tillgång

All loggning/schema körs fortfarande lokalt (localStorage) — fas 2 kopplar ihop frontend med API.
