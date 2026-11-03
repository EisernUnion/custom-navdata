import { FenixDfdAdapter } from './adapters/fenix-dfd.js';
import { FslabsAdapter } from './adapters/fslabs.js';
import { fslabsGibraltar } from './packages/gibraltar-fslabs.js';
import { gibraltar } from './packages/gibraltar.js';
import { NavDataService } from './service.js';

// Register future packages and platform adapters here; discovery and IPC stay generic.
export const navDataService = new NavDataService([
    { ...gibraltar, platformVariants: { fslabs: fslabsGibraltar } }
], [new FenixDfdAdapter(), new FslabsAdapter()]);
