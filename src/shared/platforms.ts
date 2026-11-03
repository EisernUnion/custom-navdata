
/** Display metadata shared by discovery and the renderer. */
export const platforms = [
    {
        id: 'fenix',
        name: 'Fenix',
        extension: '.db3',
        locationHint: 'C:\\ProgramData\\Fenix\\NavdataDFD'
    },
    {
        id: 'fslabs',
        name: 'FSLabs',
        extension: '.rom',
        locationHint: 'HKEY_CURRENT_USER\\Software\\FlightSimLabs\\MSFS2024\\Common_AddonPath → Path_MSFS2024'
    }
] as const;
export type PlatformId = typeof platforms[number]['id'];
export function getPlatform(id: PlatformId) {
    return platforms.find(platform => platform.id === id)!;
}

export function isPlatformId(value: unknown): value is PlatformId {
    return platforms.some(platform => platform.id === value);
}
