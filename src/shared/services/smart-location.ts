import { GeolocationService } from './geolocation';
import { LocationCacheService } from './location-cache';

export interface LocationResult {
    latitude: number;
    longitude: number;
    city?: string;
    source: 'cache' | 'gps' | 'default';
}

const DEFAULT_LOCATION = {
    latitude: -6.2088,
    longitude: 106.8456,
    city: 'Jakarta'
};

export const SmartLocationService = {
    /**
     * Mendapatkan lokasi dengan prioritas: cache -> GPS -> default
     * Mengembalikan lokasi segera (non-blocking) dan update di background jika perlu
     */
    async getLocation(): Promise<LocationResult> {
        // 1. Coba gunakan cache terlebih dahulu
        const cached = await LocationCacheService.getCachedLocation();
        if (cached) {
            return {
                latitude: cached.latitude,
                longitude: cached.longitude,
                city: cached.city,
                source: 'cache'
            };
        }

        // 2. Jika tidak ada cache, coba GPS (dengan timeout)
        try {
            const position = await this.getGPSWithTimeout(5000); // 5 detik timeout
            const result: LocationResult = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                source: 'gps'
            };

            // Simpan ke cache
            await LocationCacheService.setCachedLocation(
                result.latitude,
                result.longitude,
                result.city
            );

            return result;
        } catch (e) {
            console.warn('GPS failed, using default location', e);
            return {
                ...DEFAULT_LOCATION,
                source: 'default'
            };
        }
    },

    /**
     * Update lokasi di background (non-blocking)
     */
    async updateLocationInBackground(): Promise<void> {
        try {
            const position = await this.getGPSWithTimeout(10000); // 10 detik timeout
            await LocationCacheService.setCachedLocation(
                position.coords.latitude,
                position.coords.longitude
            );
            console.log('Location updated in background');
        } catch (e) {
            console.warn('Background location update failed', e);
        }
    },

    /**
     * Mendapatkan GPS dengan timeout
     */
    async getGPSWithTimeout(timeoutMs: number): Promise<any> {
        return Promise.race([
            GeolocationService.getCurrentPosition(),
            new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('GPS timeout')), timeoutMs)
            )
        ]);
    },

    /**
     * Clear cache lokasi
     */
    async clearCache(): Promise<void> {
        await LocationCacheService.clearCache();
    }
};