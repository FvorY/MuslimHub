import { LocalNotifications } from '@capacitor/local-notifications';

export const NotificationChannelService = {
    async createPrayerNotificationChannel() {
        try {
            // Create a high-priority channel for prayer notifications
            await LocalNotifications.createChannel({
                id: 'prayer_notifications',
                name: 'Prayer Time Notifications',
                description: 'Notifications for prayer times',
                importance: 5, // HIGH importance
                visibility: 1, // PUBLIC visibility
                lights: true,
                vibration: true,
                lightColor: '#10b981',
                sound: 'adzan.mp3' // Default sound
            });

            // Create separate channel for Subuh with different sound
            await LocalNotifications.createChannel({
                id: 'subuh_notifications',
                name: 'Subuh Prayer Notifications',
                description: 'Special notifications for Subuh prayer',
                importance: 5, // HIGH importance
                visibility: 1, // PUBLIC visibility
                lights: true,
                vibration: true,
                lightColor: '#3b82f6',
                sound: 'adzan_subuh.mp3' // Subuh specific sound
            });

            // Create separate channel for Imsyak
            await LocalNotifications.createChannel({
                id: 'imsyak_notifications',
                name: 'Imsyak Notifications',
                description: 'Notifications for Imsyak time',
                importance: 4, // High importance
                visibility: 1, // PUBLIC visibility
                lights: true,
                vibration: true,
                lightColor: '#f59e0b',
                sound: 'notification.wav'
            });

            console.log('Prayer notification channels created successfully');
        } catch (error) {
            console.error('Failed to create notification channels:', error);
        }
    },

    async deletePrayerNotificationChannels() {
        try {
            await LocalNotifications.deleteChannel({ id: 'prayer_notifications' });
            await LocalNotifications.deleteChannel({ id: 'subuh_notifications' });
            await LocalNotifications.deleteChannel({ id: 'imsyak_notifications' });
            console.log('Prayer notification channels deleted');
        } catch (error) {
            console.error('Failed to delete notification channels:', error);
        }
    }
};