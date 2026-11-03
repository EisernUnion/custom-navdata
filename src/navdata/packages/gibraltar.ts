import type { NavDataPackage } from '../types.js';

// Ported from the user-supplied NavdataDFD Python implementation.
// Source SHA-256 (UTF-8): 5b36228a34cf028b5dc4d61616d23534ad7a085c2935b9b166a7ad3e7c409af5
// See docs/navdata.md for provenance and mapping notes.
export const gibraltar: NavDataPackage = {
    "id": "gibraltar",
    "version": "1.0.0",
    "name": "Gibraltar RNAV approaches",
    "description": "BAVirtual Gibraltar RNAV approaches with PIMOS transitions and missed approaches.",
    "airport": "LXGB",
    "icaoRegion": "LX",
    "area": "EUR",
    "continent": "EUROPE",
    "country": "GIBRALTAR (UK)",
    "magneticVariation": 0.3,
    "waypoints": [
        {
            "ident": "BUGOV",
            "latitude": 36.080958,
            "longitude": -5.239742
        },
        {
            "ident": "GB092",
            "latitude": 36.06885,
            "longitude": -5.299592
        },
        {
            "ident": "GB094",
            "latitude": 36.093792,
            "longitude": -5.390228
        },
        {
            "ident": "GB09F",
            "latitude": 36.106847,
            "longitude": -5.403039
        },
        {
            "ident": "GB096",
            "latitude": 36.150164,
            "longitude": -5.378714
        },
        {
            "ident": "GB270",
            "latitude": 36.100419,
            "longitude": -4.928906
        },
        {
            "ident": "GB272",
            "latitude": 36.087944,
            "longitude": -5.092822
        },
        {
            "ident": "KUXOX",
            "latitude": 36.157414,
            "longitude": -5.166344
        },
        {
            "ident": "GB276",
            "latitude": 36.155358,
            "longitude": -5.227647
        },
        {
            "ident": "GB27F",
            "latitude": 36.154664,
            "longitude": -5.248211
        },
        {
            "ident": "GBM02",
            "latitude": 36.151669,
            "longitude": -5.335536
        },
        {
            "ident": "GBM03",
            "latitude": 36.150828,
            "longitude": -5.359675
        },
        {
            "ident": "GBM04",
            "latitude": 36.086842,
            "longitude": -5.400922
        },
        {
            "ident": "GBM05",
            "latitude": 36.072736,
            "longitude": -5.389931
        },
        {
            "ident": "GBM06",
            "latitude": 36.040867,
            "longitude": -5.3298
        },
        {
            "ident": "GB501",
            "latitude": 36.141175,
            "longitude": -5.0163
        },
        {
            "ident": "GB509",
            "latitude": 36.109142,
            "longitude": -5.357464
        },
        {
            "ident": "GB513",
            "latitude": 36.110183,
            "longitude": -5.316917
        },
        {
            "ident": "GB409",
            "latitude": 36.123483,
            "longitude": -5.377294
        },
        {
            "ident": "GB403",
            "latitude": 36.138483,
            "longitude": -5.321014
        }
    ],
    "references": [
        {
            "ident": "PIMOS",
            "latitude": 36.15036111,
            "longitude": -4.89347222,
            "scope": "enroute",
            "icaoRegion": "LE"
        },
        {
            "ident": "UPMUP",
            "latitude": 36,
            "longitude": -5,
            "scope": "terminal",
            "icaoRegion": "LX"
        }
    ],
    "approaches": [
        {
            "ident": "R27-V",
            "runway": "RW27",
            "legs": [
                {
                    "description": "E  A",
                    "route": "A",
                    "transition": "PIMOS",
                    "path": "IF",
                    "fix": "PIMOS",
                    "fixType": "enroute",
                    "altitudeDescription": "+",
                    "altitude": 9000,
                    "speed": 240
                },
                {
                    "description": "E   ",
                    "route": "A",
                    "transition": "PIMOS",
                    "path": "TF",
                    "fix": "GB270",
                    "fixType": "terminal"
                },
                {
                    "description": "E   ",
                    "route": "A",
                    "transition": "PIMOS",
                    "path": "RF",
                    "fix": "GB272",
                    "fixType": "terminal",
                    "turn": "R",
                    "center": "GB501",
                    "arcLength": 9.4
                },
                {
                    "description": "E   ",
                    "route": "A",
                    "transition": "PIMOS",
                    "path": "TF",
                    "fix": "KUXOX",
                    "fixType": "terminal",
                    "speed": 210
                },
                {
                    "description": "E   ",
                    "route": "A",
                    "transition": "PIMOS",
                    "path": "TF",
                    "fix": "GB276",
                    "fixType": "terminal"
                },
                {
                    "description": "E  F",
                    "route": "A",
                    "transition": "PIMOS",
                    "path": "TF",
                    "fix": "GB27F",
                    "fixType": "terminal",
                    "altitudeDescription": "@",
                    "altitude": 1500,
                    "speed": 160
                },
                {
                    "description": "E  F",
                    "route": "R",
                    "transition": null,
                    "path": "IF",
                    "fix": "GB27F",
                    "fixType": "terminal",
                    "altitudeDescription": "@",
                    "altitude": 1500,
                    "speed": 160
                },
                {
                    "description": "GY M",
                    "route": "R",
                    "transition": null,
                    "path": "TF",
                    "fix": "RW27",
                    "fixType": "runway",
                    "altitudeDescription": "@",
                    "course": 269,
                    "distance": 4.5,
                    "verticalAngle": -3
                },
                {
                    "description": "E   ",
                    "route": "R",
                    "transition": null,
                    "path": "TF",
                    "fix": "GBM03",
                    "fixType": "terminal"
                },
                {
                    "description": "E   ",
                    "route": "R",
                    "transition": null,
                    "path": "RF",
                    "fix": "GBM04",
                    "fixType": "terminal",
                    "speed": 185,
                    "turn": "L",
                    "center": "GB509",
                    "arcLength": 5.2
                },
                {
                    "description": "E   ",
                    "route": "R",
                    "transition": null,
                    "path": "TF",
                    "fix": "GBM05",
                    "fixType": "terminal"
                },
                {
                    "description": "E   ",
                    "route": "R",
                    "transition": null,
                    "path": "RF",
                    "fix": "GBM06",
                    "fixType": "terminal",
                    "turn": "L",
                    "center": "GB513",
                    "arcLength": 3.6
                },
                {
                    "description": "E   ",
                    "route": "R",
                    "transition": null,
                    "path": "TF",
                    "fix": "UPMUP",
                    "fixType": "terminal",
                    "altitudeDescription": "@",
                    "altitude": 4000
                },
                {
                    "description": "EE H",
                    "route": "R",
                    "transition": null,
                    "path": "HM",
                    "fix": "UPMUP",
                    "fixType": "terminal",
                    "turn": "L",
                    "course": 305,
                    "distance": 4
                }
            ]
        },
        {
            "ident": "R09-V",
            "runway": "RW09",
            "legs": [
                {
                    "description": "E  A",
                    "route": "A",
                    "transition": "PIMOS",
                    "path": "IF",
                    "fix": "PIMOS",
                    "fixType": "enroute",
                    "altitudeDescription": "+",
                    "altitude": 9000,
                    "speed": 240
                },
                {
                    "description": "E   ",
                    "route": "A",
                    "transition": "PIMOS",
                    "path": "TF",
                    "fix": "BUGOV",
                    "fixType": "terminal"
                },
                {
                    "description": "E   ",
                    "route": "A",
                    "transition": "PIMOS",
                    "path": "TF",
                    "fix": "GB092",
                    "fixType": "terminal"
                },
                {
                    "description": "E   ",
                    "route": "A",
                    "transition": "PIMOS",
                    "path": "RF",
                    "fix": "GB094",
                    "fixType": "terminal",
                    "turn": "R",
                    "center": "GB403",
                    "arcLength": 4.9
                },
                {
                    "description": "E  F",
                    "route": "A",
                    "transition": "PIMOS",
                    "path": "TF",
                    "fix": "GB09F",
                    "fixType": "terminal",
                    "altitudeDescription": "@",
                    "altitude": 1500,
                    "speed": 160
                },
                {
                    "description": "E  F",
                    "route": "R",
                    "transition": null,
                    "path": "IF",
                    "fix": "GB09F",
                    "fixType": "terminal",
                    "altitudeDescription": "@",
                    "altitude": 1500,
                    "speed": 160
                },
                {
                    "description": "E   ",
                    "route": "R",
                    "transition": null,
                    "path": "RF",
                    "fix": "GB096",
                    "fixType": "terminal",
                    "altitudeDescription": "+",
                    "altitude": 380,
                    "turn": "R",
                    "center": "GB409",
                    "arcLength": 3.5,
                    "verticalAngle": -3
                },
                {
                    "description": "GY M",
                    "route": "R",
                    "transition": null,
                    "path": "TF",
                    "fix": "RW09",
                    "fixType": "runway",
                    "altitudeDescription": "@",
                    "course": 89,
                    "distance": 1,
                    "verticalAngle": -3
                },
                {
                    "description": "E   ",
                    "route": "R",
                    "transition": null,
                    "path": "TF",
                    "fix": "GBM02",
                    "fixType": "terminal"
                },
                {
                    "description": "E   ",
                    "route": "R",
                    "transition": null,
                    "path": "TF",
                    "fix": "KUXOX",
                    "fixType": "terminal"
                },
                {
                    "description": "EY  ",
                    "route": "R",
                    "transition": null,
                    "path": "TF",
                    "fix": "PIMOS",
                    "fixType": "enroute"
                },
                {
                    "description": "E   ",
                    "route": "R",
                    "transition": null,
                    "path": "DF",
                    "fix": "UPMUP",
                    "fixType": "terminal",
                    "altitudeDescription": "@",
                    "altitude": 4000,
                    "speed": 230,
                    "turn": "R"
                },
                {
                    "description": "EE H",
                    "route": "R",
                    "transition": null,
                    "path": "HM",
                    "fix": "UPMUP",
                    "fixType": "terminal",
                    "speed": 230,
                    "turn": "L",
                    "course": 305,
                    "distance": 4
                }
            ]
        }
    ]
};
