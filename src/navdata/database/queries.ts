import type { DatabaseSync } from 'node:sqlite';
import type { Row, SqlValue } from '../adapter.js';

export const quote = (identifier: string) => `"${identifier.replace(/"/g, '""')}"`;
export function matchingRows(db: DatabaseSync, table: string, key: Row): Row[] {
    const fields = Object.keys(key);
    return db.prepare(`SELECT * FROM ${quote(table)} WHERE ${fields.map(field => `${quote(field)} IS ?`).join(' AND ')}`).all(...Object.values(key)) as Row[];
}

export function sameValue(actual: unknown, expected: SqlValue): boolean {
    return typeof actual === 'number' && typeof expected === 'number' ? Math.abs(actual - expected) < 1e-8 : actual === expected;
}
