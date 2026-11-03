import type { InstallRequest } from '../navdata/types.js';
import type { NavDataApi } from '../shared/api.js';
import { platforms, type PlatformId } from '../shared/platforms.js';
import type { NavDataView, RendererState } from './state.js';

/** Owns async application state; DOM rendering is delegated to the view. */
export class NavDataController {
    private readonly state: RendererState = {
        platformId: 'fenix',
        packageId: '',
        results: [],
        packages: [],
        scanning: false,
        installingPath: null,
        feedback: null
    };
    constructor(private readonly api: NavDataApi, private readonly view: NavDataView) {
        view.bind({
            selectPlatform: id => this.selectPlatform(id),
            selectPackage: id => this.selectPackage(id),
            scan: () => { void this.scan(); },
            install: request => { void this.install(request); }
        });
    }

    async initialize(): Promise<void> {
        try {
            this.state.packages = await this.api.packages();
            this.state.packageId = this.state.packages[0]?.id || '';
        }
        catch {
            this.state.feedback = {
                state: 'error',
                message: 'Data packages could not be loaded. Restart the app and try again.'
            };
        }
        await this.scan();
    }

    private selectPlatform(id: PlatformId): void {
        this.state.platformId = id;
        this.render();
    }

    private selectPackage(id: string): void {
        this.state.packageId = id;
        this.render();
    }

    private async scan(): Promise<void> {
        this.state.scanning = true;
        this.render();
        try {
            this.state.results = await this.api.scan();
        }
        catch {
            this.state.results = platforms.map(({ id, name }) => ({
                id,
                name,
                location: null,
                status: 'error',
                files: [],
                message: 'Unable to scan databases. Please try again.'
            }));
        }
        finally {
            this.state.scanning = false;
            this.render();
        }
    }

    private async install(request: InstallRequest): Promise<void> {
        if (this.state.installingPath || this.state.scanning)
            return;
        this.state.installingPath = request.databasePath;
        this.state.feedback = {
            state: 'loading',
            message: 'Checking the database, creating a backup, and inserting missing data…'
        };
        this.render();
        try {
            const result = await this.api.install(request);
            const backup = result.backupPath ? ` Backup: ${result.backupPath}` : '';
            this.state.feedback = {
                state: result.success ? 'success' : 'error',
                message: `${result.message}${backup}`
            };
        }
        catch {
            this.state.feedback = {
                state: 'error',
                message: 'The insertion request could not be completed. Rescan to check the database status before trying again.'
            };
        }
        finally {
            await this.scan();
            this.state.installingPath = null;
            this.render();
        }
    }

    private render(): void {
        this.view.render(this.state);
    }
}
