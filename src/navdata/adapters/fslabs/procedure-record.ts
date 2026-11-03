import type { Row } from '../../adapter.js';
import { DataConflictError } from '../../database/errors.js';
import { readNumber } from '../../database/values.js';
import { nauticalMiles } from '../../geometry.js';
import type { Leg } from '../../types.js';
import type { Reference } from './context.js';

/** Fixed-width FSLabs field encoding, kept separate from reference/sequence planning. */
export function procedureRecord(leg: Leg, key: Row, fix: Reference, center: Reference | undefined, runway: Row): Row {
    const distance = leg.arcLength ?? leg.distance;
    let encodedDistance = '    ';
    if (distance !== undefined) {
        const tenths = Math.round(distance * 10);
        const isTime = leg.distanceUnit === 'minutes';
        if (tenths < 0 || tenths > (isTime ? 999 : 9999))
            throw new DataConflictError('Distance or holding time is outside the FSLabs field range.');
        encodedDistance = isTime ? `T${String(tenths).padStart(3, '0')}` : String(tenths).padStart(4, '0');
    }
    let arcRadius: number | null = null;
    if (leg.arcRadius !== undefined) {
        arcRadius = Math.round(leg.arcRadius * 1000);
    } else if (leg.path === 'RF' && center) {
        arcRadius = Math.round(nauticalMiles(center, fix) * 1000);
    }

    let altitude = leg.altitude ?? null;
    if (altitude === null && leg.altitudeDescription) {
        altitude = readNumber(runway, 'LANDING_THLD_ELEV') + readNumber(runway, 'THLD_CROSSING_HEIGHT');
    }

    return {
        ...key,
        RECD_TYPE: 'S',
        FIX_IDENT: leg.fix,
        FIX_ICAO_CODE: fix.region,
        FIX_SECT_CODE: fix.sector,
        FIX_SUBS_CODE: fix.subsection,
        WAYPOINT_DESCR_CODE: leg.description,
        TURN_DIR: leg.turn || ' ',
        RNP: leg.rnp ?? null,
        PATH_AND_TERMINATION: leg.path,
        TURN_DIR_VALID: ' ',
        RECOMMENDED_NAVAID: '',
        RECOMMENDED_NAVAID_ICAO_CODE: '  ',
        ARC_RADIUS: arcRadius,
        THETA: null,
        RHO: null,
        MAG_COURSE: leg.course ?? null,
        ROUTE_DISTANCE_HOLDING_DISTANCE_OR_TIME: encodedDistance,
        RECOMMENDED_NAVAID_SECT_CODE: ' ',
        RECOMMENDED_NAVAID_SUBS_CODE: ' ',
        ALT_DESCR: leg.altitudeDescription === '+' ? '+' : ' ',
        ATC_IND: leg.atcIndicator || ' ',
        ALT_1: altitude,
        ALT_2: null,
        TRANSITION_ALT: null,
        SPEED_LIMIT: leg.speed === undefined ? '   ' : String(leg.speed),
        VERTICAL_ANGLE: leg.verticalAngle ?? null,
        CENTER_FIX_OR_TAA_PROCEDURE_TURN_IND: center?.ident.padEnd(5, ' ') || '     ',
        MULTIPLE_CODE_OR_TAA_SECTOR_IDENT: '',
        MULTIPLE_CODE_OR_TAA_SECTOR_ICAO_CODE: center?.region || '  ',
        MULTIPLE_CODE_OR_TAA_SECTOR_SECT_CODE: center?.sector || ' ',
        MULTIPLE_CODE_OR_TAA_SECTOR_SUBS_CODE: center?.subsection || ' ',
        GNSS_FMS_INDICATION: 'B',
        SPEED_LIMIT_DESCR: leg.speed === undefined ? ' ' : '-',
        APCH_ROUTE_QUALIFIER_1: leg.qualifier1 || ' ',
        APCH_ROUTE_QUALIFIER_2: leg.qualifier2 || ' ',
        VERTICAL_SCALE_FACTOR: '   '
    };
}
