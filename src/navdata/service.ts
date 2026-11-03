import { stat } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import type { PlatformAdapter } from './adapter.js';
import { createDatabaseBackup } from './database/backup.js';
import { DataConflictError, UnsupportedSchemaError, databaseError } from './database/errors.js';
import { findMissingRows, insertRows } from './database/records.js';
import type { InstallResult, NavDataPackage, PackageCheck, PlatformId } from './types.js';

/** Coordinates checks, backups and transactions; platform SQL belongs in adapters. */
export class NavDataService {
    private installing = false;
    get isInstalling(): boolean {
        return this.installing;
    }
    constructor(readonly packages: readonly NavDataPackage[], readonly adapters: readonly PlatformAdapter[]) { }
    inspect(platformId: PlatformId, file: string): PackageCheck[] {
        const adapter = this.adapters.find(adapter => adapter.platformId === platformId);
        return this.packages.map(original => {
            const data = { ...original, ...original.platformVariants?.[platformId] };
            const base = {
                packageId: data.id,
                name: data.name,
                version: data.version
            };
            if (!adapter)
                return {
                    ...base,
                    state: 'unsupported',
                    message: `Insertion support for ${platformId === 'fslabs' ? 'FSLabs' : platformId} is not available yet.`
                };
            let db: DatabaseSync | undefined;
            try {
                db = new DatabaseSync(file, { readOnly: true, timeout: 1000 });
                db.exec('BEGIN');
                const plan = adapter.plan(db, data);
                const missing = findMissingRows(db, plan, adapter);
                return {
                    ...base,
                    state: missing.length ? 'missing' : 'installed',
                    message: missing.length ? `${missing.length} required records are missing. Matching records will be reused.` : 'All required data and supporting records are installed.'
                };
            }
            catch (error) {
                return {
                    ...base,
                    state: error instanceof UnsupportedSchemaError ? 'unsupported' : error instanceof DataConflictError ? 'conflict' : 'error',
                    message: databaseError(error)
                };
            }
            finally {
                db?.close();
            }
        });
    }

    async install(platformId: PlatformId, file: string, packageId: string, backupDirectory: string): Promise<InstallResult> {
        if (this.installing)
            return { success: false, message: 'Another data insertion is in progress. Please wait.' };
        const adapter = this.adapters.find(adapter => adapter.platformId === platformId);
        const original = this.packages.find(data => data.id === packageId);
        if (!adapter || !original)
            return { success: false, message: 'This platform or data package is not supported.' };
        const data = { ...original, ...original.platformVariants?.[platformId] };
        this.installing = true;
        let db: DatabaseSync | undefined;
        let backupPath: string | undefined;
        try {
            // Do not allow SQLite to silently create a new file at a stale scan path.
            if (!(await stat(file)).isFile())
                throw new Error('Database file was not found. Rescan and try again.');
            db = new DatabaseSync(file, { readOnly: true, timeout: 1000 });
            if (!findMissingRows(db, adapter.plan(db, data), adapter).length)
                return { success: true, message: `${data.name} is already installed. No changes were made.` };
            backupPath = await createDatabaseBackup(db, file, backupDirectory);
            db.close();
            db = undefined;
            if (!(await stat(file)).isFile())
                throw new Error('Database file was removed. Rescan and try again.');
            db = new DatabaseSync(file, { timeout: 1000 });
            db.exec('BEGIN IMMEDIATE');
            // Recheck under the write lock: another installer may have changed data since scanning.
            const rows = findMissingRows(db, adapter.plan(db, data), adapter);
            insertRows(db, rows);
            if (findMissingRows(db, adapter.plan(db, data), adapter).length)
                throw new Error('Inserted data did not pass verification.');
            db.exec('COMMIT');
            return {
                success: true,
                message: rows.length ? `${data.name} installed successfully (${rows.length} records added).` : `${data.name} is already installed.`,
                backupPath
            };
        }
        catch (error) {
            if (db?.isTransaction)
                db.exec('ROLLBACK');
            return {
                success: false,
                message: `No data was inserted. ${databaseError(error)}`,
                backupPath
            };
        }
        finally {
            db?.close();
            this.installing = false;
        }
    }
}
