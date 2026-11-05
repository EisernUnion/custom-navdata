import { DataConflictError, UnsupportedSchemaError } from '../../database/errors.js';
import { readNumber, expectOne } from '../../database/values.js';
import type { FslabsPlanContext } from './context.js';
import { find } from './lookup.js';
import { procedureRecord } from './procedure-record.js';

export function planApproaches(context: FslabsPlanContext): void {
    const { db, data, references } = context;
    for (const approach of data.approaches) {
        const runwayName = approach.runway.startsWith('RW') ? approach.runway : `RW${approach.runway}`;
        const runway = expectOne(find(db, 'RUNWAY', {
            ARPT_IDENT: data.airport,
            ARPT_ICAO_CODE: data.icaoRegion,
            RUNWAY_IDENT: runwayName,
            CONT_NR: '1'
        }), `${data.airport} ${runwayName}`);
        references.set(`runway:${runwayName}`, {
            ident: runwayName,
            latitude: readNumber(runway, 'RUNWAY_LAT'),
            longitude: readNumber(runway, 'RUNWAY_LON'),
            region: data.icaoRegion,
            sector: 'P',
            subsection: 'G'
        });
        const sequences = new Map<string, number>();
        const expected = new Set<string>();
        for (const leg of approach.legs) {
            if (!leg.fix)
                throw new UnsupportedSchemaError(`${approach.ident} has a leg without a fix, which the FSLabs adapter does not support.`);
            const fix = references.get(`${leg.fixType}:${leg.fix}`);
            if (!fix)
                throw new DataConflictError(`Cannot resolve ${leg.fix} for ${approach.ident}.`);
            const center = leg.center ? references.get(`${leg.centerType || 'terminal'}:${leg.center}`) : undefined;
            if (leg.center && !center)
                throw new DataConflictError(`Cannot resolve center ${leg.center}.`);
            const group = JSON.stringify([leg.route, leg.transition]);
            const sequence = leg.sequence ?? (sequences.get(group) || 0) + 10;
            sequences.set(group, sequence);
            const signature = JSON.stringify([leg.route, leg.transition || '', sequence]);
            if (expected.has(signature))
                throw new DataConflictError(`Duplicate package leg in ${approach.ident}.`);
            expected.add(signature);
            const key = {
                CUST_AREA: data.area,
                SECT_CODE: 'P',
                ARPT_IDENT: data.airport,
                ARPT_ICAO_CODE: data.icaoRegion,
                SUBS_CODE: 'F',
                PROC_IDENT: approach.ident,
                ROUTE_TYPE: leg.route,
                TRANSITION_IDENT: leg.transition || '',
                SEQ_NR: sequence,
                CONT_NR: '1'
            };
            context.add('AIRPORT_PROCEDURE', key, procedureRecord(leg, key, fix, center, runway), leg.sourceCycle);
        }
        const existing = find(db, 'AIRPORT_PROCEDURE', {
            ARPT_IDENT: data.airport,
            ARPT_ICAO_CODE: data.icaoRegion,
            SUBS_CODE: 'F',
            PROC_IDENT: approach.ident,
            CONT_NR: '1'
        });
        for (const row of existing) {
            if (!expected.has(JSON.stringify([String(row.ROUTE_TYPE).trim(), String(row.TRANSITION_IDENT || '').trim(), row.SEQ_NR])))
                throw new DataConflictError(`${approach.ident} contains unexpected procedure legs.`);
        }
    }
}
