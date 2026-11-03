import type { Row } from '../adapter.js';
import { DataConflictError } from './errors.js';

export function expectOne(rows: Row[], description: string): Row {
    if (rows.length !== 1)
        throw new DataConflictError(`${description}: expected one record, found ${rows.length}.`);
    return rows[0];
}

export function readNumber(row: Row, field: string): number {
    const value = row[field];
    if (typeof value !== 'number' || !Number.isFinite(value))
        throw new DataConflictError(`Missing or invalid ${field}.`);
    return value;
}

export function readIdentifier(row: Row): string {
    if (typeof row.id !== 'string' || !row.id)
        throw new DataConflictError('A required record has no ID.');
    return row.id;
}
