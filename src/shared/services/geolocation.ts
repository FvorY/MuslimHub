import { Geolocation } from '@capacitor/geolocation';

export const GeolocationService = {
    async getCurrentPosition() {
        try {
            const status = await GeolocationService.requestPermissions();
            const hasPermission =
                status.location === 'granted' || status.coarseLocation === 'granted';

            if (!hasPermission) {
                throw new Error('Location permission not granted');
            }

            const coordinates = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            });
            return coordinates;
        } catch (e) {
            console.error('Error getting location', e);
            throw e;
        }
    },

    async requestPermissions() {
        try {
            const status = await Geolocation.checkPermissions();
            if (status.location === 'granted' || status.coarseLocation === 'granted') {
                return status;
            }
            const requestStatus = await Geolocation.requestPermissions();
            return requestStatus;
        } catch (e) {
            console.error('Error requesting permissions', e);
            throw e;
        }
    }
};
