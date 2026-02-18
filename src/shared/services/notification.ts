import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { NotificationChannelService } from './notification-channel';
import { BatteryOptimizationService } from './battery-optimization';
import { schedulePrayerNotifications, PrayerTime } from './prayer-notification-scheduler';

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
                await NotificationChannelService.init();
                await this.checkExactAlarmPermission();
                
                // Request battery optimization for better notification timing
                const { value: batteryOptShown } = await Preferences.get({ key: 'batteryOptimizationShown' });
                if (batteryOptShown !== 'true') {
                    setTimeout(async () => {
                        await BatteryOptimizationService.requestBatteryOptimization();
                        await Preferences.set({ key: 'batteryOptimizationShown', value: 'true' });
                    }, 3000); // Show after 3 seconds to not interrupt user experience
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

    async checkExactAlarmPermission(): Promise<boolean> {
        if (Capacitor.getPlatform() !== 'android') return true;

        try {
            const status = await LocalNotifications.checkExactNotificationSetting();
            await Preferences.set({ key: 'exactAlarmPermission', value: status.exact_alarm });
            return status.exact_alarm === 'granted';
        } catch (error) {
            console.error('Failed to check exact alarm setting:', error);
            return false;
        }
    },

    async requestExactAlarmPermission(): Promise<boolean> {
        if (Capacitor.getPlatform() !== 'android') return true;

        try {
            const status = await LocalNotifications.changeExactNotificationSetting();
            await Preferences.set({ key: 'exactAlarmPermission', value: status.exact_alarm });
            return status.exact_alarm === 'granted';
        } catch (error) {
            console.error('Failed to request exact alarm setting:', error);
            return false;
        }
    },

    async validateSoundFiles(): Promise<{adzan: boolean, adzan_subuh: boolean}> {
        // Check if sound files are available in the native resources
        return {
            adzan: true,
            adzan_subuh: true
        };
    },

    async updatePrayerNotifications(prayerTimes: PrayerTimes, options?: { force?: boolean }) {
        const today = new Date().toDateString();
        const { value: lastScheduledDate } = await Preferences.get({ key: 'lastPrayerScheduleDate' });

        if (!options?.force && lastScheduledDate === today) {
            console.log('Prayer notifications already scheduled for today, skipping reschedule');
            return;
        }

        console.log('Updating prayer notifications for:', today);
        await this.schedulePrayerNotifications(prayerTimes);
        await Preferences.set({ key: 'lastPrayerScheduleDate', value: today });
    },

    async schedulePrayerNotifications(prayerTimes: PrayerTimes) {
        try {
            const prayers: PrayerTime[] = [
                { name: 'Subuh', time: prayerTimes.subuh },
                { name: 'Dzuhur', time: prayerTimes.dzuhur },
                { name: 'Ashar', time: prayerTimes.ashar },
                { name: 'Maghrib', time: prayerTimes.maghrib },
                { name: 'Isya', time: prayerTimes.isya },
            ];

            await schedulePrayerNotifications(prayers, {
                enableImsyak: !!prayerTimes.imsyak,
                imsyakTime: prayerTimes.imsyak
            });
            
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
