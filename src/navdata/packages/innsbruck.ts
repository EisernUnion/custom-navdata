import type { NavDataPackage } from '../types.js';

export const innsbruck: NavDataPackage = {
    id: 'innsbruck',
    version: '1.0.1',
    name: 'Innsbruck RW08 circling / RF approach',
    description: 'Innsbruck (LOWI) circling approach RW08 from WI001 via RF arc around Axams (max 140 kt).',
    airport: 'LOWI',
    icaoRegion: 'LO',
    area: 'EUR',
    continent: 'EUROPE',
    country: 'AUSTRIA',
    magneticVariation: 4.0,
    waypoints: [
        // Einstieg im Osten (Breakout-Track 230°M / 234°T)
        { ident: 'WI901', latitude: 47.27458, longitude: 11.44606, type: 'WIF' },
        { ident: 'WI902', latitude: 47.22919, longitude: 11.35135, type: 'WIF' },
        { ident: 'WI903', latitude: 47.22722, longitude: 11.28267, type: 'WIF' },

        // Tangentialer Bogenbeginn (0.43 NM westlich nach WI003 auf verlängertem Kurs 264°M)
        { ident: 'WI904', latitude: 47.22694, longitude: 11.27218, type: 'WDF' },

        // Bogenende / Eindrehen auf Final 077°M (081°T) Richtung Piste 08
        { ident: 'VIS084', latitude: 47.25208, longitude: 11.26849, type: 'WAF' },

        // Arc Center, exakt 0.76 NM von WI004 und VIS084 entfernt ('A F' = Arc Center Fix)
        { ident: 'WI08C', latitude: 47.23958, longitude: 11.27141, type: 'A F' }
    ],
    references: [],
    approaches: [
        {
            ident: 'R08-C',
            runway: 'RW08',
            legs: [
                { description: 'E  A', route: 'R', transition: null, path: 'IF', fix: 'WI901', fixType: 'terminal', altitudeDescription: '+', altitude: 4500, speed: 140 },
                { description: 'E  B', route: 'R', transition: null, path: 'TF', fix: 'WI902', fixType: 'terminal', altitudeDescription: '+', altitude: 3700, speed: 140, course: 230, distance: 4.7 },
                { description: 'E  B', route: 'R', transition: null, path: 'TF', fix: 'WI903', fixType: 'terminal', altitudeDescription: '+', altitude: 3700, speed: 140, course: 264, distance: 2.8 },
                { description: 'E  B', route: 'R', transition: null, path: 'TF', fix: 'WI904', fixType: 'terminal', altitudeDescription: '+', altitude: 3700, speed: 140, course: 264, distance: 0.43 },
                { description: 'E  F', route: 'R', transition: null, path: 'RF', fix: 'VIS084', fixType: 'terminal', altitudeDescription: '+', altitude: 2850, speed: 140, turn: 'R', center: 'WI08C', arcLength: 0.76, course: 77 },
                { description: 'G  M', route: 'R', transition: null, path: 'TF', fix: 'RW08', fixType: 'runway', altitudeDescription: '@', course: 77, distance: 2.6, verticalAngle: -3.5 },
                { description: '    ', route: 'Z', transition: null, path: 'CA', altitudeDescription: '+', altitude: 6500, course: 77 }
            ]
        }
    ]
};
