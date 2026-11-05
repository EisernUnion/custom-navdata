import { app, autoUpdater, dialog } from 'electron';
import { updateElectronApp, UpdateSourceType } from 'update-electron-app';
import { navDataService } from '../navdata/registry.js';
import { UpdateRestartCoordinator } from './update-restart.js';

export function startAutomaticUpdates(): void {
    if (!app.isPackaged || process.platform !== 'win32') return;

    const coordinator = new UpdateRestartCoordinator(
        () => navDataService.isInstalling,
        async () => {
            const result = await dialog.showMessageBox({
                type: 'info',
                title: 'BAVirtual Custom Nav Data update',
                message: 'A new version is ready to install.',
                detail: 'Restart BAVirtual Custom Nav Data to apply the update.',
                buttons: ['Restart now', 'Later'],
                defaultId: 1,
                cancelId: 1
            });
            return result.response === 0;
        },
        () => autoUpdater.quitAndInstall()
    );
    let updater: ReturnType<typeof updateElectronApp> | undefined;
    const start = () => {
        try {
            updater = updateElectronApp({
                updateSource: {
                    type: UpdateSourceType.ElectronPublicUpdateService,
                    repo: 'EisernUnion/custom-navdata'
                },
                updateInterval: '1 hour',
                notifyUser: true,
                onNotifyUser: () => coordinator.downloaded(),
                logger: console
            });
        } catch (error) {
            console.error('Automatic updates could not be started:', error);
        }
    };

    // Squirrel holds a file lock during the first launch after installation.
    const delay = setTimeout(start, process.argv.includes('--squirrel-firstrun') ? 10000 : 0);
    app.once('before-quit', () => {
        clearTimeout(delay);
        updater?.stopUpdates();
        coordinator.stop();
    });
}
