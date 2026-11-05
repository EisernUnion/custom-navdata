import { DatabaseSync } from 'node:sqlite';
import type { DatabaseHeader } from '../shared/api.js';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** effective_fromto is DDMMDDMMYY (from day/month, to day/month, year). */
export function formatEffective(raw: string): string {
    const match = /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(raw.trim());
    if (!match)
        return raw;
    const [, fromDay, fromMonth, toDay, toMonth, year] = match;
    const from = months[Number(fromMonth) - 1];
    const to = months[Number(toMonth) - 1];
    if (!from || !to)
        return raw;
    return `${Number(fromDay)} ${from} – ${Number(toDay)} ${to} 20${year}`;
}

/** Best-effort read of tbl_hdr_header; unreadable or missing headers yield undefined. */
export function readHeader(file: string): DatabaseHeader | undefined {
    let db: DatabaseSync | undefined;
    try {
        db = new DatabaseSync(file, { readOnly: true, timeout: 1000 });
        const row = db.prepare('SELECT cycle, effective_fromto, revision FROM tbl_hdr_header LIMIT 1').get() as Record<string, unknown> | undefined;
        if (!row)
            return undefined;
        const text = (value: unknown) => value === null || value === undefined ? '' : String(value);
        return {
            cycle: text(row.cycle),
            effective: formatEffective(text(row.effective_fromto)),
            revision: text(row.revision)
        };
    }
    catch {
        return undefined;
    }
    finally {
        db?.close();
    }
}
