import type { NavDataPackage } from '../types.js';

// Salzburg (LOWS) circling approach R33-C, ported from the legacy Fenix.cs (ProcessSalzburg)
// and checked against the working LOWS rows of a Fenix 2610 database.
// See docs/navdata.md for mapping notes.
export const salzburg: NavDataPackage = {
    id: 'salzburg',
    version: '1.0.0',
    name: 'Salzburg R33-C circling approach',
    description: 'BAVirtual Salzburg (LOWS) circling approach R33-C with missed approach.',
    airport: 'LOWS',
    icaoRegion: 'LO',
    area: 'EUR',
    continent: 'EUROPE',
    country: 'AUSTRIA',
    magneticVariation: 4.6,
    waypoints: [
        { ident: 'WPSI', latitude: 47.81861, longitude: 12.98767, type: 'WIF' },
        // Start of the arc on the 125 degree leg.
        { ident: 'WS900', latitude: 47.7838, longitude: 13.0597, type: 'WDF' },
        // End of the arc on the runway 33 centreline.
        { ident: 'WS903', latitude: 47.76258, longitude: 13.02339, type: 'WAF' },
        // Arc centre, 1 NM from WS903.
        { ident: 'WS33C', latitude: 47.77015, longitude: 13.04548, type: 'A F' }
    ],
    references: [],
    approaches: [
        {
            ident: 'R33-C',
            runway: 'RW33',
            legs: [
                { description: 'E  A', route: 'R', transition: 'FINAL', path: 'IF', fix: 'WPSI', fixType: 'terminal', altitudeDescription: '@', altitude: 2600, speed: 160 },
                { description: 'E  B', route: 'R', transition: 'FINAL', path: 'TF', fix: 'WS900', fixType: 'terminal', altitudeDescription: '@', altitude: 2600, speed: 160, course: 125, distance: 3.5 },
                { description: 'E  F', route: 'R', transition: 'FINAL', path: 'RF', fix: 'WS903', fixType: 'terminal', speed: 160, turn: 'R', center: 'WS33C', arcLength: 1, course: 333 },
                { description: 'G  M', route: 'R', transition: 'FINAL', path: 'TF', fix: 'RW33', fixType: 'runway', altitudeDescription: '@', course: 333, verticalAngle: -3 },
                { description: '    ', route: 'Z', transition: 'FINAL', path: 'CA', altitudeDescription: '+', altitude: 4000, course: 333 }
            ]
        }
    ]
};
