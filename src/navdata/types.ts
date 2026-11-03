import type { PlatformId } from '../shared/platforms.js';

export type { PlatformId } from '../shared/platforms.js';
export type { Approach, Fix, Leg, Navaid, NavDataContent, NavDataPackage, Waypoint } from './content.js';
export type PackageState = 'installed' | 'missing' | 'conflict' | 'unsupported' | 'error';
export interface PackageCheck {
    packageId: string;
    name: string;
    version: string;
    state: PackageState;
    message: string;
}

export interface InstallRequest {
    platformId: PlatformId;
    databasePath: string;
    packageId: string;
}

export interface InstallResult {
    success: boolean;
    message: string;
    backupPath?: string;
}

export interface PackageInfo {
    id: string;
    name: string;
    version: string;
    description: string;
}
