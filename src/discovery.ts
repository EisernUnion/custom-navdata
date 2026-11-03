import { platformLocations, type PlatformLocation } from './discovery/locations.js';
import { scanDirectory as scanPlatformDirectory } from './discovery/scan-directory.js';
import { navDataService } from './navdata/registry.js';
import type { ScanResult } from './shared/api.js';

export { readFslabsPath } from './discovery/locations.js';
export type { DatabaseFile, ScanResult } from './shared/api.js';
/** Public scan entry point: attach the registered package inspector to filesystem discovery. */
export function scanDirectory(id: ScanResult['id'], name: string, location: string, extension: string): Promise<ScanResult> {
    return scanPlatformDirectory(id, name, location, extension, (platform, file) => navDataService.inspect(platform, file));
}
async function discoverPlatform(platform: PlatformLocation): Promise<ScanResult> {
    const base = {
        id: platform.id,
        name: platform.name,
        location: null,
        files: []
    };
    try {
        const location = await platform.resolve();
        if (location)
            return scanDirectory(platform.id, platform.name, location, platform.extension);
        return {
            ...base,
            status: 'unavailable',
            message: 'FSLabs installation path was not found in the registry (Path_MSFS2024). Install or configure FSLabs, then rescan.'
        };
    }
    catch {
        return {
            ...base,
            status: 'error',
            message: 'The FSLabs registry location could not be read. Check access and rescan.'
        };
    }
}

export function discoverDatabases(): Promise<ScanResult[]> {
    return Promise.all(platformLocations.map(discoverPlatform));
}
