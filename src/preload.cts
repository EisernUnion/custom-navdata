import { contextBridge, ipcRenderer } from 'electron';
import type { NavDataApi } from './shared/api.js';

// Keep runtime dependencies limited to Electron: sandboxed preloads cannot load local modules.
const api: NavDataApi = {
    scan: () => ipcRenderer.invoke('navdata:scan'),
    packages: () => ipcRenderer.invoke('navdata:packages'),
    install: request => ipcRenderer.invoke('navdata:install', request),
    selectLocation: platformId => ipcRenderer.invoke('navdata:select-location', platformId),
    resetLocation: platformId => ipcRenderer.invoke('navdata:reset-location', platformId)
};
contextBridge.exposeInMainWorld('navdata', api);
