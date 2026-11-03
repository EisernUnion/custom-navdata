# Code structure

The application has three entry points: `src/main.ts` starts Electron, `src/preload.cts` exposes the typed API, and `src/renderer.ts` starts the UI controller. Entry points contain wiring; implementation lives in the modules below.

## Where to make changes

| Change | Location |
| --- | --- |
| Window settings and HTML/preload paths | `src/main/window.ts`, `src/main/paths.ts` |
| IPC handlers | `src/main/ipc.ts` |
| Insertion request/path validation | `src/main/installation-target.ts` |
| Shared API and scan result types | `src/shared/api.ts` |
| Platform names, extensions and location hints | `src/shared/platforms.ts` |
| Registry lookup and platform folder resolution | `src/discovery/locations.ts` |
| Top-level file enumeration | `src/discovery/scan-directory.ts` |
| Discovery/package-inspection wiring | `src/discovery.ts` |
| Async UI state and scan/insert actions | `src/ui/controller.ts` |
| Tabs, package selector and feedback | `src/ui/view.ts` |
| File rows, package badges and action buttons | `src/ui/database-table.ts` |
| UI state/action interfaces | `src/ui/state.ts` |
| Navigation content model | `src/navdata/content.ts` |
| Package check/insertion types | `src/navdata/types.ts` |
| Register packages and platform adapters | `src/navdata/registry.ts` |
| Adapter interface and planned-row types | `src/navdata/adapter.ts` |
| Backup/transaction coordination | `src/navdata/service.ts` |
| Record comparison and SQL inserts | `src/navdata/database/records.ts` |
| SQLite backups, queries, value validation and errors | `src/navdata/database/` |
| Fenix mapping | `src/navdata/adapters/fenix/` |
| FSLabs mapping | `src/navdata/adapters/fslabs/` |
| Bundled Gibraltar content | `src/navdata/packages/` |

## Data flow

1. The renderer controller calls the API exposed by the sandboxed preload.
2. Main-process IPC handlers invoke discovery or the navdata service.
3. Discovery resolves each platform location, enumerates direct child files, and checks registered packages.
4. Each platform adapter builds a read-only plan: waypoints, external references, navaids where supported, and procedures.
5. The service compares that plan with existing rows. For insertion it creates a backup, rechecks inside a transaction, inserts missing rows, verifies, and commits.
6. The controller rescans and passes state to the view; only the view/table modules manipulate the DOM.

## Adapter structure

`fenix-dfd.ts` and `fslabs.ts` are short planning pipelines. Each creates a per-call context, invokes the mapping phases, and validates the completed plan. Contexts hold schema/ID/reference state and do not write to the database. They are not retained between scans.

Both platform folders separate waypoint/reference planning from procedure planning. FSLabs additionally has a navaid planner, fixed-width lookup logic, and `procedure-record.ts` for storage-field encoding. Database SQL stays in adapters and database helpers; packages contain typed navigation content only.

Keep platform-specific field names and units in the appropriate adapter. Keep shared geometry, comparison, backup and transaction logic outside platform modules. The service remains the only layer that applies a plan.

## Extending the app

For additional navigation data, add a typed package under `src/navdata/packages/` and register it. When platform source content differs, use a neutral `platformVariants` entry. See `navdata.md` for Gibraltar source and encoding details.

For another platform, add its shared metadata, location resolver and adapter, then register the adapter. `PlatformId` is derived from the metadata list, and TypeScript requires the location-resolver map to cover every platform. Extend IPC request validation only if the new platform needs a different trust/path boundary.

## Checks

- `npm test`: TypeScript build plus SQLite, renderer-controller and insertion-path tests.
- `npm run test:ui`: actual Electron preload/renderer with mocked scan/insertion handlers.
- `npm run dev`: TypeScript watch mode plus Electron reload.

TypeScript strict mode and unused-local/parameter checks are enabled. Tests use temporary databases; UI tests mock insertion and do not modify installed navdata.
