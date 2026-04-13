# Fas 2: Fleranvändardata — Design Spec

> Migrera vattenlogg, schema och noteringar från localStorage till SQLite via API.

## Bakgrund

Fas 1 gav oss backend + auth. Men all appdata (loggar, schema, noteringar) sparas fortfarande i localStorage — osynligt för andra användare. Fas 2 flyttar denna data till servern så att alla i en anläggning delar samma data.

## Nya tabeller

### water_logs

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| id | TEXT PK | UUID |
| facility_id | TEXT FK → facilities | Anläggning |
| user_id | TEXT FK → users | Vem som loggade |
| tub_id | TEXT FK → tubs, nullable | Vilket bad (null = generellt, kopplas i Fas 3) |
| date | TEXT NOT NULL | ISO datetime |
| note | TEXT | Valfri anteckning |
| ph | REAL | |
| free_chlorine | REAL | |
| bromine | REAL | |
| total_alkalinity | REAL | |
| calcium_hardness | REAL | |
| tds | REAL | |
| water_temp | REAL | |

### notes

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| id | TEXT PK | UUID |
| facility_id | TEXT FK → facilities | Anläggning |
| user_id | TEXT FK → users | Skapare |
| title | TEXT NOT NULL | |
| due_date | TEXT NOT NULL | ISO date |
| completed | INTEGER DEFAULT 0 | |
| completed_date | TEXT | ISO datetime |

### schedule_completions

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| id | TEXT PK | UUID |
| facility_id | TEXT FK → facilities | Anläggning |
| user_id | TEXT FK → users | Vem som checkade av |
| task_id | TEXT NOT NULL | T.ex. "d1", "w2" |
| period_key | TEXT NOT NULL | T.ex. "2026-04-13" (reset-datum) |
| completed_at | TEXT NOT NULL | ISO datetime |

UNIQUE(facility_id, task_id, period_key) — en uppgift kan bara checkas av en gång per period.

## API-routes

### Water Logs
```
GET    /api/water-logs          — Lista loggar (facility-scopad, sorterade nyast först)
POST   /api/water-logs          — Skapa logg
PATCH  /api/water-logs/:id      — Uppdatera logg
DELETE /api/water-logs/:id      — Ta bort logg
```

### Notes
```
GET    /api/notes               — Lista noteringar (facility-scopad)
POST   /api/notes               — Skapa notering
PATCH  /api/notes/:id           — Toggle complete / uppdatera
DELETE /api/notes/:id           — Ta bort notering
```

### Schedule
```
GET    /api/schedule/:period    — Hämta completions för aktuell period
POST   /api/schedule/:period/:taskId — Toggle task completion
```

### Streak (beräknat server-side)
```
GET    /api/streak              — Hämta streak-data baserat på water_logs
```

## Frontend-ändringar

Hooks byter från `useLocalStorage` till `useState` + `useEffect` med API-anrop:

- `useWaterLog` → fetchar från `/api/water-logs`, muterar via POST/PATCH/DELETE
- `useNotes` → fetchar från `/api/notes`, muterar via POST/PATCH/DELETE
- `useSchedule` → fetchar completions per period, togglear via POST
- `useSettings` → **behålls i localStorage** (lokala display-inställningar)

Streak beräknas server-side baserat på water_logs-tabellen.

## Vad som INTE ändras

- Alla page-komponenter behåller samma props/interface — bara hooksen ändras
- Settings (spa-namn, volym, cykel) behålls i localStorage — de är per-enhet
- Kalkylator behöver ingen data från servern
- StripReader, TrendChart etc behåller samma interface
