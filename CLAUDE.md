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

## Obsidian Vault — Second Brain

Obsidian-vaultet är den centrala kunskapsbasen ("second brain") för alla projekt.

- **Vault:** `/Users/anton/Library/CloudStorage/OneDrive-Prefabmästarna/Dokument/Projekt/Obsidian/`
- **Struktur:** `Projekt/Aquacare/` (t.ex. `Projekt/Aquacare/SUMMARY.md`)
- **Mallar:** `Mallar/` i vault-rooten

### Regler

1. **Kolla vaultet först:** Innan du svarar på eller ställer frågor om projektet — läs relevant dokumentation i vaultet. Börja med `Projekt/Aquacare/` för att se vad som finns.
2. **Skriv dokumentation hit:** Projektdokumentation, sammanfattningar och beslut skrivs till vaultet, inte i kodrepot.
3. **GSD-planer och CLAUDE.md** ligger kvar i kodrepot — de behövs där.
4. **SUMMARY.md** i Obsidian uppdateras vid milstolpe-gränser, inte varje session.
5. **Lokal vs server-åtkomst:**
   - **Lokalt (Mac):** Läs/skriv direkt via filsökvägen. Rör INTE git i vaultet — synkas automatiskt via OneDrive + Obsidian Git-plugin.
   - **Server:** Ingen lokal sökväg finns — använd git. Kör `git pull` innan läsning och `git add . && git commit -m "vault update" && git push` efter skrivning.

## Konventioner
- UI-text på svenska, kod på engelska
- Alla designbeslut valideras med /ui-ux-pro-max
- Dokumentation skrivs till Obsidian-vaultet (se ovan), inte i repot
- Obsidian SUMMARY.md uppdateras automatiskt efter milstolpar

## Spa-detaljer (defaults)
- **Modell:** MSpa Bristol Urban U-BR062
- **Volym:** 1000 liter (default i kalkylator)
- **Max temp:** 40°C
