# Eigenes Verfahren hinzufügen (Anleitung, z. B. Calvi LFKC)

Für ein neues Verfahren sind **zwei Dateien** nötig: eine neue Paketdatei und ein Eintrag in `registry.ts`. Alles andere (Scan, Backup, Einfügen, Prüfen, Oberfläche) ist generisch.

## 1. Paketdatei anlegen

Kopiere `src/navdata/packages/salzburg.ts` nach `src/navdata/packages/calvi.ts` und passe sie an.

| Feld | Bedeutung | Beispiel Salzburg |
|---|---|---|
| `id` | eindeutiger Name, nur Kleinbuchstaben | `salzburg` |
| `version` | bei jeder Änderung hochzählen | `1.0.0` |
| `name`, `description` | Anzeige in der Auswahlliste | |
| `airport` | ICAO des Flughafens | `LOWS` |
| `icaoRegion` | ICAO-Region (erste 2 Buchstaben) | `LO` (Calvi: `LF`) |
| `area`, `continent`, `country` | Regionsangaben | `EUR`, `EUROPE`, `AUSTRIA` |
| `magneticVariation` | Missweisung in Grad (E positiv) | `4.6` |

### Wegpunkte (`waypoints`)

```ts
{ ident: 'WPSI', latitude: 47.81861, longitude: 12.98767, type: 'WIF' }
```

- Koordinaten in **Dezimalgrad** (Süd und West negativ).
- `type` ist der Wegpunkttyp der Datenbank: `WIF` (IF-Punkt), `WDF`, `WAF`, `A F` (Bogenmittelpunkt) usw.; ohne Angabe `W D`.
- Existiert ein Wegpunkt mit gleichem Namen und gleichen Koordinaten schon, wird er wiederverwendet.
- Punkte, die schon im Flughafen existieren (Navigraph-Daten), nicht neu anlegen, sondern in `references` eintragen (siehe `gibraltar.ts`).

### Anflug (`approaches`)

```ts
{ ident: 'R33-C', runway: 'RW33', legs: [ ... ] }
```

Jedes Leg:

| Feld | Bedeutung |
|---|---|
| `path` | `IF`, `TF`, `RF`, `DF`, `HM`, `CA` |
| `fix`, `fixType` | Ziel-Wegpunkt; `terminal` (eigener Punkt), `runway` (z. B. `RW33`), `enroute` (nur wenn Fix aus dem Enroute-Bereich) |
| `route` | `R` = Anflug-Hauptroute, `A` = Übergang (Transition), `Z` = Fehlanflug |
| `transition` | **`null` für die Hauptroute** (nicht `'FINAL'`!), bei `route: 'A'` der Name des Startpunkts |
| `description` | 4-stelliger Code (z. B. `'E  A'`, `'G  M'`; Fehlanflug `'    '`) |
| `altitudeDescription`, `altitude` | `@` = genau, `+` = mindestens, Höhe in ft |
| `speed` | Geschwindigkeit in kt |
| `course`, `distance` | Kurs in Grad, Strecke in NM |
| `turn`, `center`, `arcLength` | nur für `RF`: Kurvenrichtung `L`/`R`, Mittelpunkt (Wegpunkt), Bogenlänge |
| `verticalAngle` | Gleitwinkel, z. B. `-3` |

Regeln:
- Reihenfolge der Legs = Reihenfolge im Anflug.
- `CA` (Kurs bis Höhe) hat **keinen** `fix`.
- Der Fehlanflug ist `route: 'Z'`.

Zum Umrechnen aus dem alten Code (`Fenix.cs`): die dortigen `ProcessXxx`-Methoden enthalten Wegpunkte, Koordinaten, Kurse und Distanzen; diese Werte 1:1 übernehmen.

## 2. In `registry.ts` eintragen

`src/navdata/registry.ts`:

```ts
import { calvi } from './packages/calvi.js';   // import ergänzen

export const navDataService = new NavDataService([
    { ...gibraltar, platformVariants: { fslabs: fslabsGibraltar } },
    salzburg,
    calvi                                       // hier ergänzen
], [new FenixDfdAdapter(), new FslabsAdapter()]);
```

Beachte `.js` am Ende des Imports (auch bei `.ts`-Dateien).

Pakete ohne `platformVariants` gelten nur für Fenix; FSLabs zeigt sie als „Not supported yet“.

## 3. Test anlegen (empfohlen)

Kopiere `tests/salzburg.test.mjs` nach `tests/calvi.test.mjs` und ersetze `salzburg` durch `calvi`. Die Tests prüfen Einfügen, doppeltes Einfügen (darf nichts ändern) und die Leg-Struktur.

Ausführen:

```
npm ci --ignore-scripts
npm test
```

## 4. Bauen und ausprobieren

1. Änderungen committen und auf GitHub pushen.
2. GitHub → Actions → „Build Windows application“ → Run workflow (Branch wählen).
3. Fertige exe unter „Artifacts“ herunterladen und installieren.
4. In der App Paket **Calvi** wählen und bei der Datenbank **Insert data** klicken.

Vor dem Einfügen: Fenix schließen. Ein Backup wird automatisch erstellt (`%APPDATA%\BAVirtual Custom Nav Data\backups`).

## Häufige Fehler

- „contains an unexpected runtime procedure“: In der Datenbank liegen schon Zeilen desselben Verfahrens, die nicht zum Paket passen (z. B. mit anderem `transition`-Wert). Mit sauberer Datenbank oder Backup neu beginnen.
- Verfahren sichtbar, aber ohne Wegpunkte: Wegpunkt-`ident` oder Region stimmt nicht, oder `transition` ist nicht `null`.
- Neue Version desselben Verfahrens: `version` hochzählen; bereits eingefügte Daten werden nie überschrieben oder gelöscht.
