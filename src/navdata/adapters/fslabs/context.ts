import type { DatabaseSync } from 'node:sqlite';
import type { PlannedRow, Row } from '../../adapter.js';
import { DataConflictError, UnsupportedSchemaError } from '../../database/errors.js';
import { quote } from '../../database/queries.js';
import { readNumber, expectOne } from '../../database/values.js';
import type { Fix, NavDataPackage } from '../../types.js';
import { find } from './lookup.js';

export interface Reference extends Fix {
    region: string;
    sector: string;
    subsection: string;
}

/** Per-call planning state; nothing here opens a writable connection. */
export class FslabsPlanContext {
    readonly rows: PlannedRow[] = [];
    readonly references = new Map<string, Reference>();
    readonly flightPlanning: NonNullable<NavDataPackage['flightPlanning']>;
    private readonly columns: Map<string, Row[]>;
    private readonly cycle: number;
    private nextId: number;
    constructor(readonly db: DatabaseSync, readonly data: NavDataPackage) {
        if (!data.flightPlanning)
            throw new UnsupportedSchemaError('This package has no FSLabs flight-planning metadata.');
        this.flightPlanning = data.flightPlanning;
        const required = ['CYCLE_INFO', 'AIRPORT', 'RUNWAY', 'WAYPOINT', 'WAYPOINT_FLIGHT_PLANNING_CONTINUATION', 'VHF_NAVAID', 'VHF_NAVAID_FLIGHT_PLANNING_CONTINUATION', 'AIRPORT_PROCEDURE'];
        const columns = new Map<string, Row[]>();
        for (const table of required) {
            const info = db.prepare(`PRAGMA table_info(${quote(table)})`).all() as Row[];
            if (!info.length)
                throw new UnsupportedSchemaError(`Unsupported FSLabs layout: ${table} is missing.`);
            columns.set(table, info);
        }
        const cycleRows = find(db, 'CYCLE_INFO', { PARAMETER: 'CYCLE' });
        const cycle = Number(expectOne(cycleRows, 'AIRAC cycle').VALUE);
        if (!Number.isInteger(cycle) || cycle < 2001 || cycle % 100 < 1 || cycle % 100 > 13)
            throw new UnsupportedSchemaError('This FSLabs AIRAC cycle is not supported (expected 2001 or later).');
        const airport = expectOne(find(db, 'AIRPORT', {
            ARPT_IDENT: data.airport,
            ARPT_ICAO_CODE: data.icaoRegion,
            CONT_NR: '1'
        }), `${data.airport} airport`);
        if (Math.abs(readNumber(airport, 'ARPT_LAT')) > 90 || Math.abs(readNumber(airport, 'ARPT_LON')) > 180)
            throw new DataConflictError('Airport coordinates are invalid.');
        this.columns = columns;
        this.cycle = cycle;
        // FILE_RECD_NR is allocated above the global maximum, including continuation tables.
        this.nextId = 0;
        for (const row of db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all()) {
            const name = String(row.name);
            const info = columns.get(name) || db.prepare(`PRAGMA table_info(${quote(name)})`).all() as Row[];
            if (info.some(field => field.name === 'FILE_RECD_NR')) {
                const max = Number(db.prepare(`SELECT COALESCE(MAX(FILE_RECD_NR),0) AS value FROM ${quote(name)}`).get()!.value);
                if (!Number.isSafeInteger(max) || max < 0)
                    throw new UnsupportedSchemaError(`Invalid record numbers in ${name}.`);
                this.nextId = Math.max(this.nextId, max);
            }
        }
    }

    add(table: string, identity: Row, values: Row, sourceCycle?: number): Row {
        const existing = find(this.db, table, identity);
        if (existing.length > 1)
            throw new DataConflictError(`Duplicate ${table} records (${Object.values(identity).join(', ')}).`);
        const key = { ...identity };
        // Use the exact stored identity for the generic SQL checker; comparisons handle padding.
        if (existing.length)
            for (const field of Object.keys(key))
                key[field] = existing[0][field];
        const record = {
            ...values,
            FILE_RECD_NR: existing[0]?.FILE_RECD_NR ?? ++this.nextId,
            CYCLE: existing[0]?.CYCLE ?? sourceCycle ?? this.cycle
        };
        this.rows.push({
            table,
            key,
            values: record
        });
        return record;
    }

    finish(): PlannedRow[] {
        for (const row of this.rows) {
            const info = this.columns.get(row.table)!;
            for (const field of Object.keys(row.values)) {
                if (!info.some(column => column.name === field))
                    throw new UnsupportedSchemaError(`Unsupported FSLabs layout: ${row.table}.${field} is missing.`);
            }
        }
        return this.rows;
    }
}
