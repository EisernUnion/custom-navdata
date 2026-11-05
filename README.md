# BAVirtual Custom Nav Data

Windows desktop tool for installing BAVirtual custom navigation data into Fenix and FSLabs databases.

## Install

Download `BAVirtualCustomNavDataSetup.exe` from [GitHub Releases](https://github.com/bavirtual/custom-navdata/releases/latest). Installed copies check for updates automatically and offer to restart when a new release is downloaded.

## Use

1. Close the aircraft software and any navdata updater.
2. Open the app and choose a custom data package.
3. Select Fenix or FSLabs to see the discovered databases and package status.
4. Click **Insert data** beside a database with missing data.

Scans are read-only and inspect only the platform folder's direct children. Matching records are reused. Conflicting values are reported without overwriting them. Each insertion creates a SQLite backup, runs in a transaction, and verifies the result.

Fenix is discovered under `C:\ProgramData\Fenix\NavdataDFD`. Use **Select custom path** to scan another folder (saved per platform in the app data folder) and **Set default path** to go back. FSLabs uses `HKCU\Software\FlightSimLabs\MSFS2024\Common_AddonPath`, value `Path_MSFS2024`, plus `fsl-common\FSLabs\NavData`.

The included Gibraltar package contains the supplied Fenix and FSLabs approach definitions. FSLabs uses one-minute holding legs. Check the [mapping notes](docs/navdata.md) for source details and platform differences. Database validation is covered by tests; simulator behaviour still needs verification.

## Development

Requires Windows and Node.js 24 or later.

```sh
npm ci
npm run dev
```

```sh
npm test          # Build and integration/unit tests
npm run test:ui  # Electron UI smoke test; mock insertion only
npm run make     # Windows x64 Squirrel installer and update assets
```

See the [code map](docs/architecture.md) to add packages or update adapters.

## Builds and releases

Pushes to `main` and pull requests run tests and produce downloadable Windows build artifacts. To release a version:

```sh
npm version patch
 git push origin main --follow-tags
```

The `vX.Y.Z` tag must match `package.json`. The release workflow builds and uploads a **draft** GitHub Release. Review the installer and release notes, then publish the draft. Keep the installer, `*-full.nupkg`, and `RELEASES` assets together: all three are needed for automatic updates. Drafts and prereleases are not offered to installed users.

Automatic updates use Electron's public update service for `bavirtual/custom-navdata`. Update checks are disabled in development, run at startup and hourly in installed Windows copies, and download in the background. The restart prompt waits for navdata insertion to finish and offers **Restart now** or **Later**.

### Windows signing

Builds work without a signing certificate, but Windows may display an unrecognised-publisher warning. To sign app binaries and installers, configure these GitHub repository secrets:

- `WINDOWS_CERTIFICATE_BASE64`: base64-encoded PFX certificate.
- `WINDOWS_CERTIFICATE_PASSWORD`: certificate password.

For a local signed build, set `WINDOWS_CERTIFICATE_FILE` to the PFX path and `WINDOWS_CERTIFICATE_PASSWORD` before running `npm run make`. Signing material is never committed or packaged with the app. Without those values, the workflow produces unsigned builds.

## Licence

[MIT](LICENSE) — Copyright 2026 BAVirtual. Third-party dependencies retain their respective licences. Installed vendor navdata databases are not included.
