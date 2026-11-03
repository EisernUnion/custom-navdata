import type { DatabaseSync } from 'node:sqlite';
import type { PlannedRow, PlatformAdapter } from '../adapter.js';
import type { NavDataPackage } from '../types.js';
import { FenixPlanContext } from './fenix/context.js';
import { planApproaches } from './fenix/procedures.js';
import { planWaypoints, resolveReferences } from './fenix/waypoints.js';

export class FenixDfdAdapter implements PlatformAdapter {
    readonly platformId = 'fenix' as const;
    readonly name = 'Fenix NavdataDFD';
    plan(db: DatabaseSync, data: NavDataPackage): PlannedRow[] {
        const context = new FenixPlanContext(db, data);
        planWaypoints(context);
        resolveReferences(context);
        planApproaches(context);
        return context.finish();
    }
}
