import { execFile } from 'node:child_process';
import path from 'node:path';
import { getPlatform, platforms, type PlatformId } from '../shared/platforms.js';

export function readFslabsPath(): Promise<string | null> {
    if (process.platform !== 'win32')
        return Promise.resolve(null);
    return new Promise((resolve, reject) => {
        execFile('reg.exe', ['query', 'HKCU\\Software\\FlightSimLabs\\MSFS2024\\Common_AddonPath', '/v', 'Path_MSFS2024'], { windowsHide: true }, (error, stdout) => {
            if (error) {
                if ((error as Error & {
                    code?: string | number;
                }).code === 1)
                    resolve(null);
                else
                    reject(error);
                return;
            }
            const match = stdout.match(/^\s*Path_MSFS2024\s+REG_(?:EXPAND_)?SZ\s+(.+)$/im);
            const value = match?.[1].trim().replace(/^"(.*)"$/, '$1');
            resolve(value ? value.replace(/%([^%]+)%/g, (original, key: string) => process.env[key] || original) : null);
        });
    });
}

export interface PlatformLocation {
    id: PlatformId;
    name: string;
    extension: string;
    resolve(): Promise<string | null>;
}

const locationResolvers: Record<PlatformId, () => Promise<string | null>> = {
    fenix: async () => getPlatform('fenix').locationHint,
    async fslabs() {
        const base = await readFslabsPath();
        return base ? path.join(base, 'fsl-common', 'FSLabs', 'NavData') : null;
    }
};

export const platformLocations: PlatformLocation[] = platforms.map(platform => ({
    ...platform,
    resolve: locationResolvers[platform.id]
}));
