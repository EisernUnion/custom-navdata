import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isPlatformId } from '../shared/platforms.js';
import type { LocationOverrides } from '../discovery.js';

/** Persists user-chosen scan folders per platform in a small JSON file. */
export class ScanLocationStore {
    constructor(private readonly file: string) { }

    async load(): Promise<LocationOverrides> {
        try {
            const data: unknown = JSON.parse(await readFile(this.file, 'utf8'));
            const result: LocationOverrides = {};
            if (typeof data === 'object' && data !== null) {
                for (const [key, value] of Object.entries(data)) {
                    if (isPlatformId(key) && typeof value === 'string' && path.isAbsolute(value))
                        result[key] = value;
                }
            }
            return result;
        }
        catch {
            return {};
        }
    }

    async set(platformId: keyof LocationOverrides, location: string | null): Promise<void> {
        const current = await this.load();
        if (location)
            current[platformId] = location;
        else
            delete current[platformId];
        await mkdir(path.dirname(this.file), { recursive: true });
        await writeFile(this.file, JSON.stringify(current, null, 2));
    }
}
