import { app, BrowserWindow, dialog, ipcMain, type IpcMainInvokeEvent } from 'electron';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { discoverDatabases } from '../discovery.js';
import { navDataService } from '../navdata/registry.js';
import type { InstallResult } from '../navdata/types.js';
import { parseInstallRequest, resolveInstallationTarget } from './installation-target.js';
import { rendererHtml } from './paths.js';
import { ScanLocationStore } from './scan-locations.js';
import { isPlatformId } from '../shared/platforms.js';

function assertTrusted(event: IpcMainInvokeEvent): void {
    if (event.senderFrame !== event.sender.mainFrame || event.senderFrame.url !== pathToFileURL(rendererHtml).href) {
        throw new Error('Untrusted request.');
    }
}

export function registerIpcHandlers(): void {
    const store = new ScanLocationStore(path.join(app.getPath('userData'), 'scan-locations.json'));
    const discover = async () => discoverDatabases(await store.load());
    ipcMain.handle('navdata:scan', discover);
    ipcMain.handle('navdata:select-location', async (event, platformId: unknown): Promise<boolean> => {
        assertTrusted(event);
        if (!isPlatformId(platformId))
            throw new Error('Invalid platform.');
        const window = BrowserWindow.fromWebContents(event.sender);
        const options = { title: 'Select database folder', properties: ['openDirectory' as const] };
        const choice = window ? await dialog.showOpenDialog(window, options) : await dialog.showOpenDialog(options);
        if (choice.canceled || !choice.filePaths[0])
            return false;
        await store.set(platformId, choice.filePaths[0]);
        return true;
    });
    ipcMain.handle('navdata:reset-location', async (event, platformId: unknown): Promise<void> => {
        assertTrusted(event);
        if (!isPlatformId(platformId))
            throw new Error('Invalid platform.');
        await store.set(platformId, null);
    });
    ipcMain.handle('navdata:packages', () => navDataService.packages.map(({ id, name, version, description }) => ({
        id,
        name,
        version,
        description
    })));
    ipcMain.handle('navdata:install', async (event, value: unknown): Promise<InstallResult> => {
        try {
            assertTrusted(event);
            const request = parseInstallRequest(value);
            const file = await resolveInstallationTarget(request, await discover());
            const backups = path.join(app.getPath('userData'), 'backups');
            return await navDataService.install(request.platformId, file, request.packageId, backups);
        }
        catch (error) {
            return { success: false, message: error instanceof Error ? error.message : 'Unable to insert data.' };
        }
    });
}
