import type { Row } from '../../adapter.js';
import { DataConflictError } from '../../database/errors.js';
import { sameValue } from '../../database/queries.js';
import { readNumber } from '../../database/values.js';
import { nauticalMiles } from '../../geometry.js';
import type { FslabsPlanContext } from './context.js';
import { find } from './lookup.js';

export function planNavaids(context: FslabsPlanContext): void {
    const { db, data, references } = context;
    for (const navaid of data.navaids || []) {
        const key = {
            CUST_AREA: data.area,
            SECT_CODE: 'D',
            SUBS_CODE: ' ',
            ARPT_IDENT: '',
            VOR_IDENT: navaid.ident,
            VHF_ICAO_CODE: navaid.icaoRegion,
            CONT_NR: '1'
        };
        const existing = find(db, 'VHF_NAVAID', key);
        if (existing.length > 1)
            throw new DataConflictError(`Multiple ${navaid.ident} navaids exist in ${navaid.icaoRegion}.`);
        let values: Row = {
            ...key,
            RECD_TYPE: 'S',
            ARPT_ICAO_CODE: '  ',
            VOR_FREQ: navaid.frequencyMHz,
            NAVAID_CLASS: navaid.classification,
            VOR_LAT: null,
            VOR_LON: null,
            DME_IDENT: navaid.dmeIdent,
            DME_LAT: navaid.latitude,
            DME_LON: navaid.longitude,
            STATION_DECLINATION: navaid.stationDeclination,
            DME_ELEV: navaid.elevation,
            FIGURE_OF_MERIT: navaid.figureOfMerit,
            ILS_DME_BIAS: null,
            FREQ_PROTECTION: navaid.frequencyProtection,
            DATUM_CODE: 'WGE',
            VOR_NAME: navaid.name.padEnd(25, ' '),
            ROUTE_INAPPROPRIATE_DME: ' ',
            DME_OPERATIONAL_SERVICE_VOLUME: ' '
        };
        if (existing.length && navaid.reuseExisting) {
            const row = existing[0];
            if (!sameValue(row.VOR_FREQ, navaid.frequencyMHz) || nauticalMiles(navaid, {
                ident: navaid.ident,
                latitude: readNumber(row, 'DME_LAT'),
                longitude: readNumber(row, 'DME_LON')
            }) > 5 || String(row.NAVAID_CLASS).trimEnd() !== navaid.classification.trimEnd()) {
                throw new DataConflictError(`${navaid.ident} navaid differs in frequency, type or location.`);
            }
            values = row; // Preserve current AIRAC facility data instead of inserting a duplicate GBR.
        }
        const record = context.add('VHF_NAVAID', key, values, navaid.sourceCycle);
        const continuationKey = {
            ...key,
            CONT_NR: 2,
            APPLICATION_TYPE: 'P'
        };
        context.add('VHF_NAVAID_FLIGHT_PLANNING_CONTINUATION', continuationKey, {
            ...continuationKey,
            RECD_TYPE: 'S',
            ARPT_ICAO_CODE: record.ARPT_ICAO_CODE,
            FIR_IDENT: context.flightPlanning.fir,
            UIR_IDENT: context.flightPlanning.uir,
            START_END_IND: ' '
        }, navaid.sourceCycle);
        references.set(`navaid:${navaid.ident}`, {
            ident: navaid.ident,
            latitude: readNumber(record, 'DME_LAT'),
            longitude: readNumber(record, 'DME_LON'),
            region: navaid.icaoRegion,
            sector: 'D',
            subsection: ' '
        });
    }
}
