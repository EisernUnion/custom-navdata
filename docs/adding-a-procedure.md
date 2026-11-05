# Adding a custom procedure (guide, e.g. Calvi LFKC)

A new procedure needs **two changes**: a new package file and an entry in `registry.ts`. Everything else (scanning, backup, insertion, verification, UI) is generic.

## 1. Create the package file

Copy `src/navdata/packages/salzburg.ts` to `src/navdata/packages/calvi.ts` and adapt it.

| Field | Meaning | Salzburg example |
|---|---|---|
| `id` | unique name, lowercase only | `salzburg` |
| `version` | increase on every change | `1.0.0` |
| `name`, `description` | shown in the package selector | |
| `airport` | airport ICAO | `LOWS` |
| `icaoRegion` | ICAO region (first 2 letters) | `LO` (Calvi: `LF`) |
| `area`, `continent`, `country` | region details | `EUR`, `EUROPE`, `AUSTRIA` |
| `magneticVariation` | magnetic variation in degrees (east positive) | `4.6` |

### Waypoints (`waypoints`)

```ts
{ ident: 'WPSI', latitude: 47.81861, longitude: 12.98767, type: 'WIF' }
```

- Coordinates in **decimal degrees** (south and west are negative).
- `type` is the database waypoint type: `WIF` (IF fix), `WDF`, `WAF`, `A F` (arc centre), etc. Defaults to `W D`.
- If a waypoint with the same name and coordinates already exists, it is reused.
- Points that already exist at the airport (Navigraph data) should not be created again; list them in `references` instead (see `gibraltar.ts`).

### Approach (`approaches`)

```ts
{ ident: 'R33-C', runway: 'RW33', legs: [ ... ] }
```

Each leg:

| Field | Meaning |
|---|---|
| `path` | `IF`, `TF`, `RF`, `DF`, `HM`, `CA` |
| `fix`, `fixType` | target waypoint; `terminal` (own point), `runway` (e.g. `RW33`), `enroute` (only for fixes from the enroute area) |
| `route` | `R` = main approach route, `A` = transition, `Z` = missed approach |
| `transition` | **`null` for the main route** (not `'FINAL'`), for `route: 'A'` the name of the start fix |
| `description` | 4-character code (e.g. `'E  A'`, `'G  M'`; missed approach `'    '`) |
| `altitudeDescription`, `altitude` | `@` = exactly, `+` = at or above, altitude in ft |
| `speed` | speed in kt |
| `course`, `distance` | course in degrees, distance in NM |
| `turn`, `center`, `arcLength` | `RF` only: turn direction `L`/`R`, centre (waypoint), arc length |
| `verticalAngle` | glide path angle, e.g. `-3` |

Rules:
- Leg order = order of flight.
- `CA` (course to altitude) has **no** `fix`.
- The missed approach uses `route: 'Z'`.

To convert from the old code (`Fenix.cs`): the `ProcessXxx` methods contain waypoints, coordinates, courses and distances; copy those values 1:1.

## 2. Register it in `registry.ts`

`src/navdata/registry.ts`:

```ts
import { calvi } from './packages/calvi.js';   // add the import

export const navDataService = new NavDataService([
    { ...gibraltar, platformVariants: { fslabs: fslabsGibraltar } },
    salzburg,
    calvi                                       // add it here
], [new FenixDfdAdapter(), new FslabsAdapter()]);
```

Note the `.js` extension in the import, even though the source file is `.ts`.

Packages without `platformVariants` apply to Fenix only; FSLabs shows them as "Not supported yet".

## 3. Add a test (recommended)

Copy `tests/salzburg.test.mjs` to `tests/calvi.test.mjs` and replace `salzburg` with `calvi`. The tests check insertion, repeated insertion (must change nothing) and the leg structure.

Run:

```
npm ci --ignore-scripts
npm test
```

## 4. Build and try it

1. Commit your changes and push them to GitHub.
2. GitHub → Actions → "Build Windows application" → Run workflow (choose your branch).
3. Download the finished exe from "Artifacts" and install it.
4. In the app, select the **Calvi** package and click **Insert data** on the database.

Before inserting: close Fenix. A backup is created automatically (`%APPDATA%\BAVirtual Custom Nav Data\backups`).

## Common errors

- "contains an unexpected runtime procedure": the database already contains rows for the same procedure that do not match the package (e.g. a different `transition` value). Start again from a clean database or a backup.
- Procedure visible but without waypoints: the waypoint `ident` or region is wrong, or `transition` is not `null`.
- New version of the same procedure: increase `version`; data that was already inserted is never overwritten or deleted.
