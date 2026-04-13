# AquaCare Pro — Professionell badvattenplattform

## Projektöversikt
Professionell fleranvändarapp för badhus och spa-anläggningar. Personal kontrollerar spabad dagligen via telefoner/surfplattor. Ersätter papper och penna med digital loggning, schemahantering, kemikalieberäkning och compliance-rapportering. Skalas från BRF med ett bad till spahotell med 50+ pooler.

## Teknikstack
- **Frontend:** React 19 + TypeScript + Vite
- **Backend:** Express 5 + SQLite (WAL-mode) + better-sqlite3
- **Styling:** Tailwind CSS 4 (med @theme-direktiv)
- **Routing:** React Router 7 (BrowserRouter)
- **Auth:** PIN-kod + inbjudningslänkar, bcryptjs, token-baserade sessioner
- **Ikoner:** Lucide React (SVG)
- **Typsnitt:** Playfair Display (headings) + DM Sans (body)
- **Deploy:** Docker (en container, Express serverar frontend + API)

## Design
- Dark luxury: navy bakgrund (#0a1628), guld accenter (#E8C97A)
- Glassmorphism-kort med backdrop-filter: blur(12px)
- Mobile-first, 44px touch targets, 48px inputs/knappar
- Svenskt gränssnitt — decimaler med komma (7,4 inte 7.4)
- SVG-ikoner — inga emojis

## Projektstruktur
```
src/
├── main.tsx, App.tsx              # Entry + routing (12+ routes)
├── types.ts                       # Alla TypeScript interfaces
├── constants.ts                   # Gränsvärden, schemauppgifter, kemikalieformler
├── lib/api.ts                     # Typad API-klient med auto-auth
├── contexts/AuthContext.tsx        # AuthProvider, useAuth, ProtectedRoute
├── hooks/
│   ├── useLocalStorage.ts         # Generisk localStorage hook (bara för Settings)
│   ├── useWaterLog.ts             # Vattenlogg via API + streak
│   ├── useSchedule.ts             # Schema via API
│   ├── useNotes.ts                # Noteringar via API
│   └── useSettings.ts             # Lokala inställningar (localStorage)
├── components/
│   ├── Layout.tsx, BottomNav.tsx   # App-skal med 5-flikar
│   ├── GlassCard.tsx              # Glassmorphism-kort
│   ├── SmartStatus.tsx            # Intelligent statusbanner med dosrekommendation
│   ├── TrendChart.tsx             # SVG trender (pH, klor, alkalinitet)
│   ├── WaterAge.tsx               # Vattenålder per bad
│   ├── StripReader.tsx            # Teststicka-avläsning (3 steg)
│   ├── ConfirmDialog.tsx          # Bekräftelsedialog
│   └── StatusBadge.tsx, ValueBadge.tsx, ProgressRing.tsx
└── pages/
    ├── Dashboard.tsx              # Hem: status per bad, trender, streak, uppgifter
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
| `/` | Dashboard (Hem) | Protected |
| `/schema` | Underhållsschema | Protected |
| `/logg` | Vattenlogg | Protected |
| `/logg/ny` | Ny loggning | Protected |
| `/logg/redigera/:id` | Redigera loggning | Protected |
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
