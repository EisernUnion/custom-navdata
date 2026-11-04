import { FenixDfdAdapter } from './adapters/fenix-dfd.js';
import { FslabsAdapter } from './adapters/fslabs.js';
import { fslabsGibraltar } from './packages/gibraltar-fslabs.js';
import { gibraltar } from './packages/gibraltar.js';
import { salzburg } from './packages/salzburg.js';
import { NavDataService } from './service.js';

// Register future packages and platform adapters here; discovery and IPC stay generic.
export const navDataService = new NavDataService([
    { ...gibraltar, platformVariants: { fslabs: fslabsGibraltar } },
    salzburg
], [new FenixDfdAdapter(), new FslabsAdapter()]);
