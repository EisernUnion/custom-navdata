import { lstat, realpath } from 'node:fs/promises';
import path from 'node:path';
import type { InstallRequest } from '../navdata/types.js';
import type { ScanResult } from '../shared/api.js';
import { isPlatformId } from '../shared/platforms.js';

export function parseInstallRequest(value: unknown): InstallRequest {
    if (typeof value !== 'object' || value === null)
        throw new Error('Invalid insertion request.');
    const request = value as Record<string, unknown>;
    if (!isPlatformId(request.platformId) || typeof request.databasePath !== 'string' || typeof request.packageId !== 'string') {
        throw new Error('Invalid insertion request.');
    }
    return {
        platformId: request.platformId,
        databasePath: request.databasePath,
        packageId: request.packageId
    };
}

/** Revalidate a fresh scan before allowing the main process to open a writable database. */
export async function resolveInstallationTarget(request: InstallRequest, results: ScanResult[]): Promise<string> {
    const platform = results.find(result => result.id === request.platformId);
    const file = platform?.files.find(file => file.path === request.databasePath);
    if (!file || !platform?.location)
        throw new Error('Database is no longer available. Rescan and try again.');
    if ((await lstat(file.path)).isSymbolicLink())
        throw new Error('Linked database files cannot be modified.');
    const [resolvedFile, resolvedFolder] = await Promise.all([realpath(file.path), realpath(platform.location)]);
    if (path.dirname(resolvedFile).toLowerCase() !== resolvedFolder.toLowerCase()) {
        throw new Error('Database is outside the platform folder.');
    }
    return resolvedFile;
}
