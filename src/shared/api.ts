import type { InstallRequest, InstallResult, PackageCheck, PackageInfo } from '../navdata/types.js';
import type { PlatformId } from './platforms.js';

export interface DatabaseFile {
    name: string;
    path: string;
    size: number;
    modified: string;
    packages: PackageCheck[];
}

export interface ScanResult {
    id: PlatformId;
    name: string;
    location: string | null;
    status: 'ready' | 'unavailable' | 'error';
    message: string;
    files: DatabaseFile[];
}

/** The only application capabilities exposed to the sandboxed renderer. */
export interface NavDataApi {
    scan(): Promise<ScanResult[]>;
    packages(): Promise<PackageInfo[]>;
    install(request: InstallRequest): Promise<InstallResult>;
}
