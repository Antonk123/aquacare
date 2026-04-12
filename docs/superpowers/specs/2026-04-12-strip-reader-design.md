# Teststicka-avläsning — Design Spec

## Syfte

Låta användaren avläsa sin teststicka genom att tappa på färgrutor som matchar stickans färger, istället för att manuellt skriva in värden. Snabbare och enklare vid poolen med blöta händer.

## Placering

Inbyggd i `/logg/ny` (WaterLogForm.tsx). En knapp "Avläs teststicka" visas ovanför formulärfälten.

## Flöde

1. Användaren trycker "Avläs teststicka" (Pipette-ikon från Lucide)
2. Ett GlassCard expanderar med steg-för-steg-guide
3. Tre steg, ett i taget:
   - **Steg 1: Fritt klor** — 7 färgcirklar (0, 0.5, 1, 2, 3, 5, 10 ppm)
   - **Steg 2: pH** — 5 färgcirklar (6.2, 6.8, 7.2, 7.8, 8.4)
   - **Steg 3: Alkalinitet** — 6 färgcirklar (0, 40, 80, 120, 180, 240 ppm)
4. Tap på en färg → guld ring-markering → automatiskt nästa steg (kort delay ~300ms)
5. Efter sista steget stängs guiden och värdena är förifyllda i formuläret
6. Användaren kan justera manuellt och spara som vanligt

## Färgdata (från referensbilder)

### Fritt klor (ppm)
| Värde | Färg (hex) | Beskrivning |
|-------|-----------|-------------|
| 0     | #F5F0E0   | Vit/beige   |
| 0.5   | #F5E0D0   | Mycket ljusrosa |
| 1     | #F0C4B0   | Ljusrosa    |
| 2     | #E8A0A0   | Rosa        |
| 3     | #D07080   | Mellanrosa  |
| 5     | #C05070   | Mörkrosa    |
| 10    | #A03060   | Djuprosa/magenta |

### pH
| Värde | Färg (hex) | Beskrivning |
|-------|-----------|-------------|
| 6.2   | #D4A030   | Gul/orange  |
| 6.8   | #D07040   | Orange      |
| 7.2   | #C86050   | Röd-orange  |
| 7.8   | #C04060   | Rosa-röd    |
| 8.4   | #A03058   | Mörkröd     |

### Alkalinitet (ppm)
| Värde | Färg (hex) | Beskrivning |
|-------|-----------|-------------|
| 0     | #D4C850   | Gul         |
| 40    | #A0B848   | Gulgrön     |
| 80    | #70A040   | Grön        |
| 120   | #C09030   | Orange      |
| 180   | #C06030   | Röd-orange  |
| 240   | #903020   | Mörkröd     |

## Komponenter

### StripReader.tsx (ny)
- Props: `onComplete: (values: { freeChlorine: number; ph: number; totalAlkalinity: number }) => void`, `onCancel: () => void`
- State: `currentStep` (0-2), `selectedValues`
- Visar ett steg i taget med rubrik, färgcirklar och steg-indikator (1/3, 2/3, 3/3)
- Varje färgcirkel: minst 48x48px, 8px gap, `ring-2 ring-gold` vid markering
- Bakåt-knapp för att ändra föregående steg

### constants.ts (uppdatering)
- Ny export `TEST_STRIP_COLORS` med färgdata för alla tre parametrar

### WaterLogForm.tsx (uppdatering)
- Ny knapp "Avläs teststicka" ovanför formulärfälten
- Toggle-state för att visa/dölja StripReader
- `onComplete` callback fyller i `values` state

## Design

- Färgcirklar med `border-2 border-white/20` som default
- Vald cirkel: `ring-2 ring-gold ring-offset-2 ring-offset-navy`
- Steg-indikator: tre små prickar, aktiv i guld
- Label under varje cirkel med värde + enhet
- GlassCard-wrapper runt hela guiden
- Animerad transition mellan steg (opacity + translateX)

## Vad som inte byggs
- Ingen kamera/foto-funktionalitet
- Ingen automatisk färgigenkänning
- Ingen bildsparning
