import type { Row } from '../../adapter.js';
import { readNumber, expectOne } from '../../database/values.js';
import { nauticalMiles } from '../../geometry.js';
import type { FslabsPlanContext } from './context.js';
import { find } from './lookup.js';

export function planWaypoints(context: FslabsPlanContext): void {
    const { data, references } = context;
    for (const waypoint of data.waypoints) {
        const region = waypoint.icaoRegion || data.icaoRegion;
        const key = {
            CUST_AREA: data.area,
            SECT_CODE: 'P',
            REGION_CODE: data.airport,
            REGION_ICAO_CODE: data.icaoRegion,
            REGION_SUBS_CODE: 'C',
            WAYPOINT_IDENT: waypoint.ident,
            WAYPOINT_ICAO_CODE: region,
            CONT_NR: '1'
        };
        context.add('WAYPOINT', key, {
            ...key,
            RECD_TYPE: 'S',
            SUBS_CODE: ' ',
            WAYPOINT_TYPE: waypoint.type || 'W F',
            WAYPOINT_USAGE: '  ',
            WAYPOINT_LAT: waypoint.latitude,
            WAYPOINT_LON: waypoint.longitude,
            DYNAMIC_MAG_VAR: waypoint.magneticVariation ?? data.magneticVariation,
            DATUM_CODE: 'WGE',
            NAME_FORMAT_IND: '   ',
            WAYPOINT_NAME_DESCR: waypoint.ident.padEnd(25, ' ')
        }, waypoint.sourceCycle);
        const continuationKey = {
            ...key,
            CONT_NR: 2,
            APPLICATION_TYPE: 'P'
        };
        context.add('WAYPOINT_FLIGHT_PLANNING_CONTINUATION', continuationKey, {
            ...continuationKey,
            RECD_TYPE: 'S',
            SUBS_CODE: ' ',
            FIR_IDENT: context.flightPlanning.fir,
            UIR_IDENT: context.flightPlanning.uir,
            START_END_IND: ' '
        }, waypoint.sourceCycle);
        references.set(`terminal:${waypoint.ident}`, {
            ...waypoint,
            region,
            sector: 'P',
            subsection: 'C'
        });
    }
}

export function resolveReferences(context: FslabsPlanContext): void {
    const { db, data, references } = context;
    for (const reference of data.references) {
        const key: Row = {
            WAYPOINT_IDENT: reference.ident,
            CONT_NR: '1',
            CUST_AREA: data.area,
            SECT_CODE: reference.scope === 'enroute' ? 'E' : 'P'
        };
        if (reference.scope === 'terminal')
            key.REGION_CODE = data.airport;
        else
            key.WAYPOINT_ICAO_CODE = reference.icaoRegion;
        const row = expectOne(find(db, 'WAYPOINT', key).filter(row => nauticalMiles(reference, {
            ident: reference.ident,
            latitude: readNumber(row, 'WAYPOINT_LAT'),
            longitude: readNumber(row, 'WAYPOINT_LON')
        }) < 30), `${reference.ident} reference waypoint`);
        references.set(`${reference.scope}:${reference.ident}`, {
            ident: reference.ident,
            latitude: readNumber(row, 'WAYPOINT_LAT'),
            longitude: readNumber(row, 'WAYPOINT_LON'),
            region: String(row.WAYPOINT_ICAO_CODE).trim(),
            sector: String(row.SECT_CODE).trim(),
            subsection: reference.scope === 'terminal' ? String(row.REGION_SUBS_CODE).trim() : String(row.SUBS_CODE).trim()
        });
    }
}
