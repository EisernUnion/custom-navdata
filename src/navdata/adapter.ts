import type { DatabaseSync } from 'node:sqlite';
import type { NavDataPackage, PlatformId } from './types.js';

export type SqlValue = string | number | null;
export type Row = Record<string, SqlValue>;
export interface PlannedRow {
    table: string;
    key: Row;
    values: Row;
}

export interface PlatformAdapter {
    readonly platformId: PlatformId;
    readonly name: string;
    /** Validate schema and resolve database-specific references without writing. */
    plan(db: DatabaseSync, data: NavDataPackage): PlannedRow[];
    /** Optional comparison for fixed-width formats; SQL identities remain exact. */
    sameValue?(actual: unknown, expected: SqlValue, column: string): boolean;
}
