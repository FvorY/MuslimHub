import { Geolocation } from '@capacitor/geolocation';

export const GeolocationService = {
    async getCurrentPosition() {
        try {
            const coordinates = await Geolocation.getCurrentPosition();
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
