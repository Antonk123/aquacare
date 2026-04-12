# Dashboard Redesign — Design Spec

## Syfte

Bygga om dashboarden från basic MVP till ett informationstätt "command center" med smarta rekommendationer. Ska kännas som ett riktigt verktyg, inte en demo.

## Ny struktur (top to bottom)

### 1. Header
- AquaCare + spanamn + senaste temp (om loggad)

### 2. Smart statusbanner (kontextuell)
Analyserar senaste loggens värden mot OPTIMAL_RANGES och visar:
- **Alla optimala:** Grön banner — "Allt ser bra ut" + tid sedan senaste test
- **Varningar:** Gul banner — specifikt vad som avviker + doserings-rekommendation från CALCULATOR_FORMULAS (t.ex. "Klornivån är låg. Tillsätt 4g diklorgranuler med pumpen igång.")
- **Kritiskt:** Röd banner — samma format men starkare färg
- **Ingen logg:** Neutral banner — "Logga ditt första vattentest"

Rekommendationslogik: matcha avvikande värde mot närmaste CalculatorFormula, beräkna dosering med DEFAULT_SETTINGS.waterVolume.

### 3. Värdekort (3-kolumner)
Alla tre huvudvärden från senaste loggen (pH, Fritt klor, Alkalinitet) med:
- Stort värde med färgkodning (ok/warn/error)
- Label under
- Progress bar (position relativt optimal range)

### 4. pH-trendgraf
- SVG sparkline med senaste 7 loggarna
- Optimal-zon (7.2–7.6) markerad som semi-transparent rektangel
- Daglabels under
- Senaste punkt markerad med cirkel
- Om < 2 loggningar: visa "Logga fler test för att se trenden"

### 5. Vattenålder + Streak (2-kolumner)
**Vattenålder:**
- Dagar sedan senaste vattenbyte
- "Byte om ~Xd" (baserat på 90 dagars cykel)
- Ny localStorage-nyckel: `aquacare_water_change` = `{ lastChange: ISO-string }`
- Knapp "Markera vattenbyte" (sätter lastChange till idag)

**Streak:**
- Dagar i rad med loggning
- "Bäst: X dagar" (ny StreakData-field: `bestStreak`)

### 6. Dagens uppgifter (inline checklista)
- Visar dagliga tasks från SCHEDULE_TASKS.daily
- Checkboxar som togglear direkt (samma useSchedule hook)
- "X av Y klara" som header
- Klart-state: alla gröna med bock

### 7. CTA
- "Logga vattentest" knapp (oförändrad)

## Nya typer

```typescript
// types.ts
interface WaterChangeData {
  lastChange: string  // ISO date
}

// Utöka StreakData
interface StreakData {
  currentStreak: number
  bestStreak: number    // NY
  lastLogDate: string
}
```

## Nya konstanter

```typescript
// constants.ts
export const WATER_CHANGE_CYCLE_DAYS = 90
```

## Nya storage-nycklar

```typescript
STORAGE_KEYS.waterChange = 'aquacare_water_change'
```

## Komponent-uppdelning

Dashboard.tsx blir för stor med allt detta. Bryt ut:
- `SmartStatus.tsx` — statusbanner med rekommendationslogik
- `TrendChart.tsx` — SVG sparkline med optimal-zon
- `WaterAge.tsx` — vattenålder med markera-byte-knapp

Resten (värdekort, streak, uppgifter, CTA) stannar inline i Dashboard.tsx.

## Rekommendationslogik (SmartStatus)

```
1. Hämta senaste logg
2. Om ingen logg → "Logga ditt första vattentest"
3. Loopa OPTIMAL_RANGES, hitta värsta avvikelse (error > warn)
4. Om alla ok → grön "Allt ser bra ut"
5. Om avvikelse:
   a. Bestäm riktning (för högt / för lågt)
   b. Hitta matchande CALCULATOR_FORMULA (raise-ph, lower-ph, etc.)
   c. Beräkna dosering: steps × dosagePerUnit × (volume/1000)
   d. Visa: "{Label} är {för högt/lågt}. Tillsätt {X}g {product}."
   e. Visa instruktion från formeln
```

## Vad som inte byggs
- Ingen graf för klor/alkalinitet (bara pH)
- Ingen historisk jämförelse av vattenbyten
- Inga push-notifikationer
