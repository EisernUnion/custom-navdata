import type { DatabaseSync } from 'node:sqlite';
import type { Row } from '../../adapter.js';
import { quote } from '../../database/queries.js';

export function find(db: DatabaseSync, table: string, key: Row): Row[] {
    const fields = Object.keys(key);
    // Anchor on the indexed identifier before checking fixed-width padding. Wrapping every
    // field in TRIM alone would scan the entire global waypoint table for each lookup.
    const widths: Record<string, number> = {
        WAYPOINT_IDENT: 5,
        VOR_IDENT: 4,
        ARPT_IDENT: 4
    };
    const anchor = Object.keys(widths).find(field => typeof key[field] === 'string');
    const prefix = anchor ? `${quote(anchor)} IN (?, ?) AND ` : '';
    const anchors = anchor ? [String(key[anchor]).trim(), String(key[anchor]).trim().padEnd(widths[anchor], ' ')] : [];
    return db.prepare(`SELECT * FROM ${quote(table)} WHERE ${prefix}${fields.map(field => typeof key[field] === 'string'
        ? `TRIM(COALESCE(CAST(${quote(field)} AS TEXT),'')) = ?` : `${quote(field)} IS ?`).join(' AND ')}`)
        .all(...anchors, ...Object.values(key).map(value => typeof value === 'string' ? value.trim() : value)) as Row[];
}
