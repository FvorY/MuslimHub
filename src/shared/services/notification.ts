import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { NotificationChannelService } from './notification-channel';
import { BatteryOptimizationService } from './battery-optimization';

export interface PrayerTimes {
    subuh: string;
    dzuhur: string;
    ashar: string;
    maghrib: string;
    isya: string;
    imsyak: string;
}

export const NotificationService = {
    async requestPermissions() {
        const status = await LocalNotifications.checkPermissions();
        if (status.display === 'granted') {
            return true;
        }
        const result = await LocalNotifications.requestPermissions();
        return result.display === 'granted';
    },

    async initializeBackgroundNotifications() {
        try {
            // Create notification channels for Android
            if (Capacitor.getPlatform() === 'android') {
                await NotificationChannelService.createPrayerNotificationChannel();
                
                // Request battery optimization for better notification timing
                const { value: batteryOptShown } = await Preferences.get({ key: 'batteryOptimizationShown' });
                if (batteryOptShown !== 'true') {
                    setTimeout(async () => {
                        await BatteryOptimizationService.requestBatteryOptimization();
                        await Preferences.set({ key: 'batteryOptimizationShown', value: 'true' });
                    }, 3000); // Show after 3 seconds to not interrupt user experience
                }
                
                const { value } = await Preferences.get({ key: 'exactAlarmPermission' });
                if (value !== 'granted') {
                    console.log('Requesting exact alarm permission for background notifications');
                    // This will be handled by the plugin automatically
                }
            }
            
            // Register background notification listeners
            await this.registerNotificationListeners();
            console.log('Background notifications initialized');
        } catch (error) {
            console.error('Failed to initialize background notifications:', error);
        }
    },

    async registerNotificationListeners() {
        // Listen for notification actions
        LocalNotifications.addListener('localNotificationReceived', (notification) => {
            console.log('Notification received in background:', notification);
        });

        LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
            console.log('Notification action performed:', action);
        });
    },

    async validateSoundFiles(): Promise<{adzan: boolean, adzan_subuh: boolean}> {
        // Check if sound files are available in the native resources
        // For now, return true as we trust the files are in android/app/src/main/res/raw/
        // In a real implementation, you might want to check file existence
        return {
            adzan: true,
            adzan_subuh: true
        };
    },

    async updatePrayerNotifications(prayerTimes: PrayerTimes) {
        // Check if notification times are still valid for today
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        // Get current notifications
        const pending = await LocalNotifications.getPending();
        
        // On-demand re-scheduling
        const needsUpdate = pending.notifications.length === 0;

        if (needsUpdate) {
            console.log('Updating prayer notifications for:', today);
            await this.schedulePrayerNotifications(prayerTimes);
        } else {
            console.log('Prayer notifications are still valid');
        }
    },

    async schedulePrayerNotifications(prayerTimes: PrayerTimes) {
        try {
            // Cancel existing first to avoid duplicates
            await this.cancelAllNotifications();

            const prayers = [
                { id: 1, name: 'Subuh', time: prayerTimes.subuh, sound: 'adzan_subuh.mp3' },
                { id: 2, name: 'Dzuhur', time: prayerTimes.dzuhur, sound: 'adzan.mp3' },
                { id: 3, name: 'Ashar', time: prayerTimes.ashar, sound: 'adzan.mp3' },
                { id: 4, name: 'Maghrib', time: prayerTimes.maghrib, sound: 'adzan.mp3' },
                { id: 5, name: 'Isya', time: prayerTimes.isya, sound: 'adzan.mp3' },
                { id: 6, name: 'Imsyak', time: prayerTimes.imsyak, sound: 'notification.wav' },
            ];

            const notifications = prayers
                .filter(prayer => prayer.time) // Filter out prayers with no time
                .map(prayer => {
                const [hours, minutes] = prayer.time.split(':').map(Number);
                
                // Create trigger time with date to ensure accurate timing
                const now = new Date();
                const triggerTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
                
                // If time has passed for today, schedule for tomorrow
                if (triggerTime <= now) {
                    triggerTime.setDate(triggerTime.getDate() + 1);
                }

                return {
                    id: prayer.id,
                    title: prayer.name === 'Imsyak' ? 'Waktu Imsyak' : `Waktunya Sholat ${prayer.name}`,
                    body: prayer.name === 'Imsyak' ? 'Waktu imsyak telah tiba.' : `Mari tunaikan ibadah sholat ${prayer.name} tepat waktu.`,
                    schedule: {
                        at: triggerTime,
                        allowWhileIdle: true,
                        exact: true, // For exact timing on Android
                    },
                    sound: prayer.sound,
                    actionTypeId: '',
                    extra: {
                        prayerName: prayer.name,
                        prayerTime: prayer.time,
                        autoCancel: false, // Keep notification until user dismisses
                        ongoing: true // Show as ongoing notification
                    },
                    channelId: prayer.name === 'Subuh' ? 'subuh_notifications' : prayer.name === 'Imsyak' ? 'imsyak_notifications' : 'prayer_notifications',
                    ongoing: true, // Make it ongoing notification
                    autoCancel: false, // Don't auto-cancel
                    // Add high priority for better timing
                    priority: 2, // HIGH priority
                    visibility: 1, // PUBLIC visibility
                    group: 'prayer_notifications',
                    groupSummary: true,
                    smallIcon: 'ic_stat_icon_config_sample',
                    iconColor: '#10b981'
                };
            });

            await LocalNotifications.schedule({
                notifications
            });
            
            console.log(`Successfully scheduled ${notifications.length} prayer notifications with custom sounds`);
            console.log('Notification details:', notifications.map(n => ({
                id: n.id,
                name: n.title,
                sound: n.sound,
                triggerAt: n.schedule.at
            })));
            
            return true;
        } catch (error) {
            console.error('Error scheduling notifications:', error);
            throw error;
        }
    },

    async cancelAllNotifications() {
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
            await LocalNotifications.cancel({
                notifications: pending.notifications
            });
        }
        console.log('All prayer notifications canceled');
    },

    async showNotificationTroubleshooting(): Promise<void> {
        try {
            await BatteryOptimizationService.showBatteryOptimizationInfo();
        } catch (error) {
            console.error('Failed to show notification troubleshooting:', error);
        }
    }
};
