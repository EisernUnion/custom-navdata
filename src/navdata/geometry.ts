import type { Fix } from './types.js';

export function nauticalMiles(a: Fix, b: Fix): number {
    const radians = (value: number) => value * Math.PI / 180;
    const lat1 = radians(a.latitude), lat2 = radians(b.latitude);
    const h = Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(radians(b.longitude - a.longitude) / 2) ** 2;
    return 6880.13 * Math.asin(Math.sqrt(Math.min(1, h)));
}
