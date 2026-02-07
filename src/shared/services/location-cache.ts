import { StorageService } from './storage';

export interface CachedLocation {
    latitude: number;
    longitude: number;
    city?: string;
    timestamp: number;
}

const STORAGE_KEY_LOCATION = 'muslimhub_cached_location';
const LOCATION_CACHE_DURATION = 30 * 60 * 1000; // 30 menit

export const LocationCacheService = {
    async getCachedLocation(): Promise<CachedLocation | null> {
        try {
            const cached = await StorageService.get<CachedLocation>(STORAGE_KEY_LOCATION);
            if (!cached) return null;

            const now = Date.now();
            const age = now - cached.timestamp;

            if (age > LOCATION_CACHE_DURATION) {
                await this.clearCache();
                return null;
            }

            return cached;
        } catch (e) {
            console.error('Error getting cached location', e);
            return null;
        }
    },

    async setCachedLocation(latitude: number, longitude: number, city?: string): Promise<void> {
        try {
            const cachedLocation: CachedLocation = {
                latitude,
                longitude,
                city,
                timestamp: Date.now()
            };
            await StorageService.set(STORAGE_KEY_LOCATION, cachedLocation);
        } catch (e) {
            console.error('Error setting cached location', e);
        }
    },

    async clearCache(): Promise<void> {
        try {
            await StorageService.remove(STORAGE_KEY_LOCATION);
        } catch (e) {
            console.error('Error clearing location cache', e);
        }
    }
};