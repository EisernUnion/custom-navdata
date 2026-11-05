import type { PlatformId } from '../shared/platforms.js';

export interface Fix {
    ident: string;
    latitude: number;
    longitude: number;
}

export interface Waypoint extends Fix {
    icaoRegion?: string;
    type?: string;
    magneticVariation?: number;
    sourceCycle?: number;
}

export interface Navaid extends Fix {
    icaoRegion: string;
    name: string;
    frequencyMHz: number;
    classification: string;
    dmeIdent: string;
    elevation: number;
    stationDeclination: string;
    figureOfMerit: string;
    frequencyProtection: string;
    sourceCycle?: number;
    /** Reuse an existing facility by identity/frequency/location; never overwrite current AIRAC data. */
    reuseExisting?: boolean;
}

export interface Leg {
    /** Omitted for legs without a terminating fix, such as CA. */
    fix?: string;
    fixType?: 'terminal' | 'enroute' | 'runway';
    path: 'IF' | 'TF' | 'RF' | 'DF' | 'HM' | 'CA';
    route: 'A' | 'R' | 'Z';
    transition: string | null;
    description: string;
    altitudeDescription?: '+' | '@';
    altitude?: number;
    speed?: number;
    turn?: 'L' | 'R';
    center?: string;
    arcLength?: number;
    course?: number;
    distance?: number;
    verticalAngle?: number;
    distanceUnit?: 'nm' | 'minutes';
    sequence?: number;
    rnp?: number;
    arcRadius?: number;
    centerType?: 'terminal' | 'navaid';
    atcIndicator?: string;
    qualifier1?: string;
    qualifier2?: string;
    sourceCycle?: number;
}

export interface Approach {
    ident: string;
    runway: string;
    legs: Leg[];
}

/** Platform-neutral content. SQLite table/column names belong in adapters. */
export interface NavDataContent {
    airport: string;
    icaoRegion: string;
    area: string;
    continent: string;
    country: string;
    magneticVariation: number;
    waypoints: Waypoint[];
    references: (Fix & {
        scope: 'terminal' | 'enroute';
        icaoRegion: string;
    })[];
    approaches: Approach[];
    navaids?: Navaid[];
    flightPlanning?: {
        fir: string;
        uir: string;
    };
}

export interface NavDataPackage extends NavDataContent {
    id: string;
    version: string;
    name: string;
    description: string;
    platformVariants?: Partial<Record<PlatformId, NavDataContent>>;
}
