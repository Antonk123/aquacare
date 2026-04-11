# AquaCare — Spa & Hot Tub Maintenance App

## Projektöversikt
Personlig underhållsapp för spa/hot tub. Hjälper till att spåra vattenkemi, underhållsschema, kemikaliedosering och påminnelser. Byggd för en MSpa Bristol Urban U-BR062 (930–1100 liter).

## Teknikstack
- **Ramverk:** React 18 + TypeScript
- **Build:** Vite
- **Styling:** Tailwind CSS 4 (med @theme-direktiv)
- **Routing:** React Router 7 (BrowserRouter)
- **Ikoner:** Lucide React (SVG)
- **Typsnitt:** Playfair Display (headings) + DM Sans (body)
- **Data:** localStorage (ingen backend)

## Design
- Dark luxury: navy bakgrund (#0a1628), guld accenter (#E8C97A)
- Glassmorphism-kort med backdrop-filter: blur(12px)
- Mobile-first, 44px touch targets, 48px inputs/knappar
- Svenskt gränssnitt — decimaler med komma (7,4 inte 7.4)
- SVG-ikoner — inga emojis

## Projektstruktur
```
src/
├── main.tsx, App.tsx           # Entry + routing
├── types.ts                    # Alla TypeScript interfaces
├── constants.ts                # Optimala värden, uppgifter, formler, storage keys
├── hooks/
│   ├── useLocalStorage.ts      # Generisk localStorage hook
│   ├── useWaterLog.ts          # Vattenlogg CRUD + streak
│   ├── useSchedule.ts          # Schema med auto-reset per period
│   └── useNotes.ts             # Noteringar CRUD
├── components/
│   ├── Layout.tsx              # Wrapper med BottomNav
│   ├── BottomNav.tsx           # 5-flikar: Hem, Schema, Logg, Kalkyl, Noteringar
│   ├── GlassCard.tsx           # Glassmorphism-kort
│   ├── StatusBadge.tsx         # Optimalt/Varning/Kritiskt med ikon
│   ├── ProgressRing.tsx        # SVG cirkulär progress
│   └── ValueBadge.tsx          # Färgkodad värdebadge
└── pages/
    ├── Dashboard.tsx           # Vattenstatus, streak, nästa uppgift
    ├── Schedule.tsx            # Progress ring, periodflikar, checklista
    ├── WaterLog.tsx            # Logghistorik + referensvärden
    ├── WaterLogForm.tsx        # Nytt loggformulär (/logg/ny)
    ├── Calculator.tsx          # Kemikaliekalkylator med formler
    └── Notes.tsx               # Påminnelser med datum
```

## Routes
| Path | Sida |
|------|------|
| `/` | Dashboard (Hem) |
| `/schema` | Underhållsschema |
| `/logg` | Vattenlogg |
| `/logg/ny` | Ny loggning (formulär) |
| `/kalkyl` | Kemikaliekalkylator |
| `/noteringar` | Noteringar & påminnelser |

## localStorage-nycklar
- `aquacare_water_log` — WaterLogEntry[]
- `aquacare_schedule` — ScheduleState
- `aquacare_notes` — Note[]
- `aquacare_settings` — Settings
- `aquacare_streak` — StreakData

## Konventioner
- UI-text på svenska, kod på engelska
- Alla designbeslut valideras med /ui-ux-pro-max
- Dokumentation skrivs till Obsidian-vaultet (`Projekt/Aquacare/`), inte i repot
- Obsidian SUMMARY.md uppdateras automatiskt efter milstolpar

## Spa-detaljer (defaults)
- **Modell:** MSpa Bristol Urban U-BR062
- **Volym:** 1000 liter (default i kalkylator)
- **Max temp:** 40°C
