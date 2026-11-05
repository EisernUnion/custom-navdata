# Workflow: from a new procedure to a release

This guide covers the full cycle: adding a procedure (e.g. Calvi), testing it, and publishing a release. For the content of the package file itself see [adding-a-procedure.md](adding-a-procedure.md).

## Overview

| Goal | What you do | Result |
|---|---|---|
| Test for yourself | Run the **Build Windows application** workflow | ZIP under "Artifacts", kept 14 days |
| Share with others | Push a version tag (`vX.Y.Z`) | Draft GitHub Release with installer; installed apps can auto-update |

You never need a release just to test. Use releases only when others should receive the update.

## Step 1: Work on a branch

```
git checkout main
git pull
git checkout -b calvi
```

Add `src/navdata/packages/calvi.ts` and register it in `src/navdata/registry.ts` (see the other guide). Optionally add `tests/calvi.test.mjs`.

## Step 2: Run the tests locally (optional but recommended)

Requires Node 24 or newer.

```
npm ci --ignore-scripts
npm test
```

## Step 3: Commit and push

```
git add -A
git commit -m "Add Calvi procedure"
git push -u origin calvi
```

## Step 4: Build a test exe

1. Open the repository on GitHub, then **Actions**.
2. Select **Build Windows application**.
3. Click **Run workflow**, choose branch `calvi`, and start it.
4. After about 4 minutes, open the finished run and download `BAVirtual-Custom-Nav-Data-Windows-x64` under **Artifacts**.
5. Unzip it and run the installer.

Command-line alternative:

```
gh workflow run build.yml --ref calvi
```

## Step 5: Test in the app

1. Close Fenix and any navdata updater.
2. Select the **Calvi** package.
3. Click **Insert data** on the database.
4. Check the procedure in the simulator.

A backup is created automatically in `%APPDATA%\BAVirtual Custom Nav Data\backups`.

If the insertion reports "unexpected runtime procedure", old rows of the same procedure exist in the database. Restore a backup or use a clean database.

## Step 6: Merge to main

1. On GitHub open a **Pull request** from `calvi` to `main`.
2. Wait until the tests pass, then click **Merge pull request**.

## Step 7: Publish a release (only when others should get it)

Releases are built by the **Draft Windows release** workflow whenever a tag `vX.Y.Z` is pushed. The tag must equal the version in `package.json`.

```
git checkout main
git pull
npm version patch
git push
git push origin vX.Y.Z
```

Replace `X.Y.Z` with the new version printed by `npm version patch` (for example `v1.0.1`). Use `npm version minor` for larger feature releases.

Then:

1. Open **Releases** on GitHub. The workflow creates a **draft** release.
2. Check that the installer, the `*-full.nupkg` file, and `RELEASES` are attached. All three are required for automatic updates.
3. Edit the release notes and click **Publish release**.

Drafts and prereleases are never offered to installed apps.

## Important: which repository releases are published to

`forge.config.js` publishes releases to `bavirtual/custom-navdata`, and the installed app also checks that repository for updates (`src/main/updates.ts`).

- Releases and auto-updates only work from the `bavirtual` repository (the release workflow needs write access there).
- Your fork (`EisernUnion/custom-navdata`) is for development and test builds. To release, open a pull request from your fork to `bavirtual/custom-navdata` and let a maintainer there merge it and push the tag.
- If you want to publish from your own repository instead, change the owner in `forge.config.js` and `src/main/updates.ts`.

## Checklist

- [ ] Package file created and registered
- [ ] `npm test` passes
- [ ] Test exe built and verified in the simulator
- [ ] Pull request merged into `main`
- [ ] Version bumped and tag pushed (release only)
- [ ] Draft release reviewed and published (release only)
