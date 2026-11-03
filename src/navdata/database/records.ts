import type { DatabaseSync } from 'node:sqlite';
import type { PlannedRow, PlatformAdapter } from '../adapter.js';
import { DataConflictError } from './errors.js';
import { matchingRows, quote, sameValue } from './queries.js';

export function findMissingRows(db: DatabaseSync, plan: PlannedRow[], adapter: PlatformAdapter): PlannedRow[] {
    const missing: PlannedRow[] = [];
    for (const row of plan) {
        const existing = matchingRows(db, row.table, row.key);
        if (existing.length > 1)
            throw new DataConflictError(`Duplicate records in ${row.table} (${Object.values(row.key).join(', ')}).`);
        if (!existing.length) {
            missing.push(row);
            continue;
        }
        const differences = Object.entries(row.values).filter(([column, expected]) => {
            const actual = existing[0][column];
            const matches = adapter.sameValue
                ? adapter.sameValue(actual, expected, column)
                : sameValue(actual, expected);
            return !matches;
        });
        if (differences.length)
            throw new DataConflictError(`Existing ${row.table} record differs (${Object.values(row.key).join(', ')}; ${differences.map(([key]) => key).join(', ')}). Existing data will not be overwritten.`);
    }
    return missing;
}

export function insertRows(db: DatabaseSync, rows: PlannedRow[]): void {
    for (const row of rows) {
        const columns = Object.keys(row.values);
        const fields = columns.map(quote).join(', ');
        const placeholders = columns.map(() => '?').join(', ');
        db.prepare(`INSERT INTO ${quote(row.table)} (${fields}) VALUES (${placeholders})`).run(...Object.values(row.values));
    }
}
