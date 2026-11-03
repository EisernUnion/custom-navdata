import type { DatabaseSync } from 'node:sqlite';
import type { PlannedRow, PlatformAdapter, SqlValue } from '../adapter.js';
import { sameValue } from '../database/queries.js';
import type { NavDataPackage } from '../types.js';
import { FslabsPlanContext } from './fslabs/context.js';
import { planNavaids } from './fslabs/navaids.js';
import { planApproaches } from './fslabs/procedures.js';
import { planWaypoints, resolveReferences } from './fslabs/waypoints.js';

export class FslabsAdapter implements PlatformAdapter {
    readonly platformId = 'fslabs' as const;
    readonly name = 'FSLabs ARINC navdata';
    sameValue(actual: unknown, expected: SqlValue): boolean {
        // Padding and blank-vs-NULL are equivalent in optional fixed-width text fields.
        if (typeof expected === 'string')
            return (actual == null ? '' : String(actual)).trimEnd() === expected.trimEnd();
        return sameValue(actual, expected);
    }

    plan(db: DatabaseSync, data: NavDataPackage): PlannedRow[] {
        const context = new FslabsPlanContext(db, data);
        planWaypoints(context);
        resolveReferences(context);
        planNavaids(context);
        planApproaches(context);
        return context.finish();
    }
}
