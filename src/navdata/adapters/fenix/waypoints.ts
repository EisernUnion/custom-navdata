import type { Row } from '../../adapter.js';
import { DataConflictError } from '../../database/errors.js';
import { matchingRows } from '../../database/queries.js';
import { expectOne, readIdentifier, readNumber } from '../../database/values.js';
import { nauticalMiles } from '../../geometry.js';
import type { FenixPlanContext, ResolvedFix } from './context.js';

export function planWaypoints(context: FenixPlanContext): void {
    const { db, data, fixes } = context;
    for (const waypoint of data.waypoints) {
        const key = { region_code: data.airport, waypoint_identifier: waypoint.ident };
        const existing = matchingRows(db, 'tbl_pc_terminal_waypoints', key);
        if (existing.length > 1)
            throw new DataConflictError(`Multiple ${waypoint.ident} waypoints exist at ${data.airport}.`);
        const id = existing.length ? readIdentifier(existing[0]) : `PC:${++context.nextWaypointId}`;
        const fix: ResolvedFix = {
            ...waypoint,
            id,
            region: data.icaoRegion,
            table: 'PC'
        };
        fixes.set(`terminal:${waypoint.ident}`, fix);
        context.rows.push({
            table: 'tbl_pc_terminal_waypoints',
            key,
            values: {
                ...key,
                id,
                area_code: data.area,
                continent: data.continent,
                country: data.country,
                datum_code: 'WGE',
                icao_code: data.icaoRegion,
                magnetic_variation: data.magneticVariation,
                waypoint_latitude: waypoint.latitude,
                waypoint_longitude: waypoint.longitude,
                waypoint_name: waypoint.ident,
                waypoint_type: waypoint.type ?? 'W D'
            }
        });
        context.addRuntime(fix);
    }
}

export function resolveReferences(context: FenixPlanContext): void {
    const { db, data, fixes } = context;
    for (const reference of data.references) {
        const table = reference.scope === 'enroute' ? 'tbl_ea_enroute_waypoints' : 'tbl_pc_terminal_waypoints';
        const key: Row = { waypoint_identifier: reference.ident };
        if (reference.scope === 'terminal')
            key.region_code = data.airport;
        else
            key.icao_code = reference.icaoRegion;
        const nearby = matchingRows(db, table, key).filter(row => nauticalMiles(reference, {
            ident: reference.ident,
            latitude: readNumber(row, 'waypoint_latitude'),
            longitude: readNumber(row, 'waypoint_longitude')
        }) < 30);
        const row = expectOne(nearby, `${reference.ident} reference waypoint`);
        const fix: ResolvedFix = {
            ident: reference.ident,
            id: readIdentifier(row),
            region: String(row.icao_code),
            latitude: readNumber(row, 'waypoint_latitude'),
            longitude: readNumber(row, 'waypoint_longitude'),
            table: reference.scope === 'enroute' ? 'EA' : 'PC'
        };
        fixes.set(`${reference.scope}:${reference.ident}`, fix);
        context.addRuntime(fix);
    }
}
