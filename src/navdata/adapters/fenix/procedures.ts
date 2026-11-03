import type { PlannedRow } from '../../adapter.js';
import { DataConflictError } from '../../database/errors.js';
import { matchingRows } from '../../database/queries.js';
import { expectOne, readIdentifier, readNumber } from '../../database/values.js';
import { nauticalMiles } from '../../geometry.js';
import type { FenixPlanContext } from './context.js';

export function planApproaches(context: FenixPlanContext): void {
    const { db, data, fixes } = context;
    for (const approach of data.approaches) {
        const runwayName = approach.runway.startsWith('RW') ? approach.runway : `RW${approach.runway}`;
        const runway = expectOne(matchingRows(db, 'tbl_pg_runways', { airport_identifier: data.airport, runway_identifier: runwayName }), `${data.airport} ${runwayName}`);
        fixes.set(`runway:${runwayName}`, {
            ident: runwayName,
            id: readIdentifier(runway),
            region: data.icaoRegion,
            latitude: readNumber(runway, 'runway_latitude'),
            longitude: readNumber(runway, 'runway_longitude'),
            table: 'PG'
        });
        const groups = new Map<string, number>();
        const runtimeGroups = new Map<string, PlannedRow>();
        const expectedKeys = new Set<string>();
        for (const leg of approach.legs) {
            const fix = fixes.get(`${leg.fixType}:${leg.fix}`);
            if (!fix)
                throw new DataConflictError(`Cannot resolve ${leg.fix} for ${approach.ident}.`);
            const center = leg.center ? fixes.get(`terminal:${leg.center}`) : undefined;
            if (leg.center && !center)
                throw new DataConflictError(`Cannot resolve arc center ${leg.center}.`);
            const group = JSON.stringify([leg.route, leg.transition]);
            const seqno = (groups.get(group) || 0) + 10;
            groups.set(group, seqno);
            expectedKeys.add(JSON.stringify([leg.route, leg.transition, seqno]));
            const distance = leg.arcLength ?? leg.distance ?? null;
            const altitude = leg.altitude ?? (leg.altitudeDescription ? readNumber(runway, 'landing_threshold_elevation') + readNumber(runway, 'threshold_crossing_height') : null);
            const key = {
                airport_identifier: data.airport,
                procedure_identifier: approach.ident,
                route_type: leg.route,
                transition_identifier: leg.transition,
                seqno
            };
            context.rows.push({
                table: 'tbl_pf_iaps',
                key,
                values: {
                    ...key,
                    area_code: data.area,
                    path_termination: leg.path,
                    gnss_fms_indication: 'B',
                    ctl: 'N',
                    waypoint_identifier: leg.fix,
                    waypoint_icao_code: fix.region,
                    waypoint_latitude: fix.latitude,
                    waypoint_longitude: fix.longitude,
                    waypoint_ref_table: fix.table,
                    waypoint_identifier_id: fix.id,
                    waypoint_description_code: leg.description,
                    turn_direction: leg.turn ?? null,
                    altitude_description: leg.altitudeDescription ?? null,
                    altitude1: altitude,
                    speed_limit_description: leg.speed === undefined ? null : '-',
                    speed_limit: leg.speed ?? null,
                    vertical_angle: leg.verticalAngle ?? null,
                    arc_radius: center ? Math.round(nauticalMiles(center, fix) * 10) / 10 : null,
                    center_waypoint: center?.ident ?? null,
                    center_waypoint_icao_code: center?.region ?? null,
                    center_waypoint_latitude: center?.latitude ?? null,
                    center_waypoint_longitude: center?.longitude ?? null,
                    center_waypoint_ref_table: center ? 'PC' : null,
                    center_waypoint_id: center?.id ?? null,
                    course: leg.course ?? null,
                    course_flag: leg.course === undefined ? null : 'M',
                    distance_time: distance,
                    route_distance_holding_distance_time: distance === null ? null : leg.distanceUnit === 'minutes' ? 'T' : 'D'
                }
            });
            const runtimeKey = {
                source_table: 2,
                airport_identifier: data.airport,
                procedure_identifier: approach.ident,
                route_type: leg.route,
                transition_identifier: leg.transition
            };
            runtimeGroups.set(group, {
                table: 'ps_runtime_procedures',
                key: runtimeKey,
                values: {
                    ...runtimeKey,
                    gnss_fms_indication: 'B',
                    runway_identifier: runwayName
                }
            });
        }
        // Extra or unexpected legs must not be accepted as a complete package.
        for (const existing of matchingRows(db, 'tbl_pf_iaps', { airport_identifier: data.airport, procedure_identifier: approach.ident })) {
            if (!expectedKeys.has(JSON.stringify([existing.route_type, existing.transition_identifier, existing.seqno]))) {
                throw new DataConflictError(`${approach.ident} contains unexpected legs. No existing data has been changed.`);
            }
        }
        for (const existing of matchingRows(db, 'ps_runtime_procedures', {
            source_table: 2,
            airport_identifier: data.airport,
            procedure_identifier: approach.ident
        })) {
            if (!runtimeGroups.has(JSON.stringify([existing.route_type, existing.transition_identifier]))) {
                throw new DataConflictError(`${approach.ident} contains an unexpected runtime procedure.`);
            }
        }
        context.rows.push(...runtimeGroups.values());
    }
}
