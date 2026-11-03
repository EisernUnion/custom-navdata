import type { NavDataApi } from './shared/api.js';

declare global {
    interface Window {
        navdata: NavDataApi;
    }
}
