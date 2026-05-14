# AquaCare Pro — Professionell badvattenplattform

## Projektöversikt
Professionell fleranvändarapp för badhus och spa-anläggningar. Personal kontrollerar spabad dagligen via telefoner/surfplattor. Ersätter papper och penna med digital loggning, schemahantering, kemikalieberäkning och compliance-rapportering. Skalas från BRF med ett bad till spahotell med 50+ pooler.

## Teknikstack
- **Frontend:** React 19 + TypeScript + Vite
- **Backend:** Express 5 + SQLite (WAL-mode) + better-sqlite3
- **Styling:** Tailwind CSS 4 (@theme med oklch-tokens, mood-byte via `data-mood` på `<html>`)
- **Routing:** React Router 7 (BrowserRouter)
- **Auth:** PIN-kod + inbjudningslänkar, bcryptjs, token-baserade sessioner
- **Ikoner:** Lucide React (SVG)
- **Typsnitt:** Newsreader (display, serif) + Geist (body, sans) + JetBrains Mono
- **Dev-server:** `concurrently` startar Express (`:3000`) + Vite (`:5173`) parallellt; Vite proxar `/api` → Express
- **Deploy:** Docker (en container, Express serverar frontend + API)

## Design — Spa-inspired med 3 mood-paletter

Designsystemet bygger på **en uppsättning semantiska tokens** (`cream`, `charcoal`, `accent`, `status-*`) som mappas om via `[data-mood="..."]` på `<html>`. Ingen JSX behöver ändras vid mood-byte; mood persisteras i `localStorage` (`aquacare_mood`).

| Mood | Karaktär | Mode |
|------|----------|------|
| `hammam` (default) | Mineral blue, imma, eucalyptus | Light |
| `terme` | Sand, terrakotta, djupvatten | Light |
| `onsen` | Teak, djupvatten, guld | Dark (`color-scheme: dark`) |

- Editorial typografi — serif rubriker, humanist sans i brödtext
- Mobile-first, 44px touch targets, 48px inputs/knappar
- Svenskt gränssnitt — decimaler med komma (7,4 inte 7.4)
- SVG-ikoner — inga emojis
- `WaterSurface.tsx` — animerad vattenyta (rAF) som hero på Dashboard
- `ThemeToggle.tsx` — mood-väljare med gradient-pucks (sol-knapp i navbaren)

## Projektstruktur
```
src/
├── main.tsx, App.tsx              # Entry + routing (15 routes)
├── index.css                      # @theme med oklch-tokens + [data-mood] overrides
├── types.ts                       # Alla TypeScript interfaces
├── constants.ts                   # Gränsvärden, schemauppgifter, kemikalieformler
├── lib/api.ts                     # Typad API-klient med auto-auth
├── contexts/AuthContext.tsx        # AuthProvider, useAuth, ProtectedRoute
├── hooks/
│   ├── useLocalStorage.ts         # Generisk localStorage hook (bara för Settings)
│   ├── useTheme.ts                # Mood-hantering (hammam/terme/onsen) + initThemeBeforeMount
│   ├── useWaterLog.ts             # Vattenlogg via API + streak
│   ├── useSchedule.ts             # Schema via API
│   ├── useNotes.ts                # Noteringar via API
│   └── useSettings.ts             # Lokala inställningar (localStorage)
├── components/
│   ├── Layout.tsx, BottomNav.tsx   # App-skal med 5 flikar (Idag, Vattenlogg, Underhåll, Kalkylator, Trender)
│   ├── ThemeToggle.tsx            # Mood-väljare i navbaren
│   ├── WaterSurface.tsx           # Animerad vattenyta (rAF) på Dashboard
│   ├── GlassCard.tsx              # Återanvändbart kort
│   ├── SmartStatus.tsx            # Intelligent statusbanner med dosrekommendation
│   ├── TrendChart.tsx             # SVG trender (pH, klor, alkalinitet)
│   ├── WaterAge.tsx               # Vattenålder per bad
│   ├── StripReader.tsx            # Teststicka-avläsning (3 steg)
│   ├── ConfirmDialog.tsx          # Bekräftelsedialog
│   └── StatusBadge.tsx, ValueBadge.tsx, ProgressRing.tsx
└── pages/
    ├── Dashboard.tsx              # Idag: status per bad, vattenyta, trender, streak, uppgifter
    ├── More.tsx                   # Hub-sida med grid-länkar till sekundära sidor
    ├── Schedule.tsx               # 4 periodflikar, checklista
    ├── WaterLog.tsx               # Logghistorik med bad-filter
    ├── WaterLogForm.tsx           # Ny/redigera logg, teststicka, bad-väljare
    ├── Calculator.tsx             # Kemikaliekalkylator med säkerhetsgränser
    ├── Notes.tsx                  # Noteringar med datum
    ├── Settings.tsx               # Inställningar, admin-panel, bad-CRUD, gränsvärden
    ├── Reports.tsx                # Rapporter: filter, compliance, trender, CSV
    ├── Activity.tsx               # Aktivitetslogg (vem/vad/när)
    ├── Welcome.tsx, CreateFacility.tsx, JoinFacility.tsx, Login.tsx  # Auth-sidor

server/
├── index.ts                       # Express setup, middleware, routes, statisk filservering
├── db.ts                          # SQLite-anslutning, WAL-mode
├── migrate.ts                     # Auto-migrations vid uppstart
├── middleware/auth.ts             # Token-validering, adminOnly
├── middleware/rateLimit.ts        # In-memory rate limiter
├── routes/
│   ├── facilities.ts              # Skapa, join, invite
│   ├── auth.ts                    # Login, logout, me, streak
│   ├── tubs.ts                    # CRUD bad
│   ├── users.ts                   # Personalhantering
│   ├── waterLogs.ts               # Vattenloggar CRUD
│   ├── notes.ts                   # Noteringar CRUD
│   ├── schedule.ts                # Schema-avprickningar per period
│   ├── waterChanges.ts            # Vattenbyten
│   ├── activity.ts                # Aktivitetslogg
│   └── reports.ts                 # Filtrerade rapporter med sammanfattning
└── migrations/                    # 001-006 SQL
```

## Routes
| Path | Sida | Auth |
|------|------|------|
| `/valkom` | Välkomstsida | Public |
| `/skapa` | Skapa anläggning | Public |
| `/join` | Gå med via kod | Public |
| `/login` | Logga in | Public |
| `/` | Dashboard (Idag) | Protected |
| `/schema` | Underhållsschema | Protected |
| `/logg` | Vattenlogg | Protected |
| `/logg/ny` | Ny loggning | Protected |
| `/logg/redigera/:id` | Redigera loggning | Protected |
| `/mer` | Hub-sida (More) | Protected |
| `/kalkyl` | Kemikaliekalkylator | Protected |
| `/noteringar` | Noteringar | Protected |
| `/installningar` | Inställningar + admin | Protected |
| `/rapporter` | Rapporter | Protected |
| `/aktivitet` | Aktivitetslogg | Protected |

## Databas (SQLite)
9 tabeller: facilities, users, sessions, tubs, water_logs, notes, schedule_completions, water_changes, activity_log

## Deployment
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

## Obsidian Vault — Second Brain

Obsidian-vaultet är den centrala kunskapsbasen ("second brain") för alla projekt.

- **Vault (server):** `/home/anton/obsidian-vault/`
- **Struktur:** `Projekt/Aquacare/` (SUMMARY.md, roadmap, sessionsloggar)

### Regler

1. **Kolla vaultet först:** Innan du svarar på eller ställer frågor om projektet — läs relevant dokumentation i vaultet. Börja med `Projekt/Aquacare/SUMMARY.md`.
2. **Skriv dokumentation hit:** Projektdokumentation, sammanfattningar och beslut skrivs till vaultet, inte i kodrepot.
3. **GSD-planer och CLAUDE.md** ligger kvar i kodrepot — de behövs där.
4. **Dokumentera aktivt:** Uppdatera Obsidian SUMMARY.md löpande under sessionen — inte bara vid milstolpar. Varje betydande ändring (ny funktion, buggfix, arkitekturbeslut) ska dokumenteras så att nästa session enkelt kan läsa ikapp.
5. **Server-åtkomst:** Kör `git pull` innan läsning och `git add . && git commit -m "vault update" && git push` efter skrivning.

## Konventioner
- UI-text på svenska, kod på engelska
- Dokumentation skrivs till Obsidian-vaultet, inte i repot
- Kemikaliedoser måste ha maxgräns per tillfälle och disclaimer
- All data (utom lokala display-inställningar) sparas via API, inte localStorage

## Kemikaliesäkerhet
- Doser i `constants.ts` är ungefärliga riktlinjer, inte exakta
- Varje formel har `maxPerApplication` — överskridande triggar orange varning
- SmartStatus respekterar maxgränser i rekommendationer
- Disclaimer visas alltid: "Följ alltid produktens datablad"
- **Ändra aldrig doser utan att verifiera mot produktdatablad**
