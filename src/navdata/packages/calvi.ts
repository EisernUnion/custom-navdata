import type { NavDataPackage } from '../types.js';

export const calvi: NavDataPackage = {
    id: 'calvi',
    version: '1.0.0',
    name: 'Calvi MVL Circling Approach Rwy 36',
    description: 'Calvi (LFKC) circling approach Rwy 36 with missed approach.',
    airport: 'LFKC',
    icaoRegion: 'LF',
    area: 'EUR',
    continent: 'EUROPE',
    country: 'FRANCE',
    magneticVariation: 4.6,
    waypoints: [
        // Target table: tbl_pc_terminal_waypoints
        // https://developers.navigraph.com/docs/navigation-data/dfd-data-format-v2#waypoint-type-for-terminal-waypoints-pc

        // FK001: Initial Fix auf dem Meer (Ouverture 3.0 NM Nord)
        // Type: 'WIF' InitialFix || 1st letter pos: 'W' = RNAV WPT | 2nd letter pos: Functional Waypoint Type like Final, Intermediate, Initital Fix | 3rd letter pos:  F = Approach, D = SID, E = STAR, Z = Multiple
        { ident: 'FK001', latitude: 42.59820, longitude: 8.79300, type: 'WIF' },

        // FK002: Gegenanflug Höhe Wassertanks / Beginn Sinken
        // Type: 'W F' IntermediateFix || 1st letter pos: 'W' = RNAV WPT | 3rd lett   
        { ident: 'FK002', latitude: 42.54500, longitude: 8.76100, type: 'W F' },

        // FK003: Kurven-Einstiegspunkt am Steinbruch (Carrière)
        // Type: 'WDF' Intermediate Approach Fix || 1st letter pos: 'W' = RNAV WPT | 2nd letter pos: Functional Waypoint Type like Final, Intermediate, Initital Fix | 3rd letter pos:  F = Approach, D = SID, E = STAR, Z = Multiple
        { ident: 'FK003', latitude: 42.50150, longitude: 8.76100, type: 'WDF' },

        // FK004: Kurven-Ausstiegspunkt (Final Fix vor der Piste)
        // Type: 'WAF' Final Approach Fix || 1st letter pos: 'W' = RNAV WPT | 3rd letter pos: Functional Waypoint Type like Final, Intermediate, Initital Fix, F = Approach, D = SID, E = STAR, Z = Multiple
        { ident: 'FK004', latitude: 42.50150, longitude: 8.79300, type: 'WAF' },

        // FK36C: ArcCenter (1 NM von FK004 entfernt, Radius 1 NM) Arc centre, 0,64 NM from WS903. 
        // Type: 'A F' Arc Fix || 1st letter pos: 'A' for Arc Center Fix, 'W' = RNAV WPT | 3rd letter pos: Kind of Procedure, F = Approach, D = SID, E = STAR, Z = Multiple
        { ident: 'FK36C', latitude: 42.50150, longitude: 8.77850, type: 'A F' }
    ],
    references: [],
    approaches: [
        {
            ident: 'MVL36',
            runway: 'RW36',
            legs: [
                { description: 'E  A', route: 'R', transition: null, path: 'IF', fix: 'FK001', fixType: 'terminal', altitudeDescription: '@', altitude: 1700 },
                { description: 'E  B', route: 'R', transition: null, path: 'TF', fix: 'FK002', fixType: 'terminal', altitudeDescription: '+', altitude: 1300 },
                { description: 'E  B', route: 'R', transition: null, path: 'TF', fix: 'FK003', fixType: 'terminal', altitudeDescription: '@', altitude: 1300, speed: 140 },
                { description: 'E  F', route: 'R', transition: null, path: 'RF', fix: 'FK004', fixType: 'terminal', turn: 'L', center: 'FK36C', arcLength: 0.71, course: 357, speed: 140, verticalAngle: 3.5 },
                { description: 'G  M', route: 'R', transition: null, path: 'TF', fix: 'RW36', fixType: 'runway', course: 357, verticalAngle: 3.5 },
                { description: '    ', route: 'Z', transition: null, path: 'CA', course: 357, altitudeDescription: '+', altitude: 2500 },
                { description: '    ', route: 'Z', transition: null, path: 'DF', fix: 'FK001', fixType: 'terminal', turn: 'R', altitudeDescription: '+', altitude: 4000 }
            ]

        }
    ]
};
