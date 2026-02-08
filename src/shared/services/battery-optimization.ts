import { Capacitor } from '@capacitor/core';
import { Dialog } from '@capacitor/dialog';
import { Browser } from '@capacitor/browser';

export const BatteryOptimizationService = {
    async checkBatteryOptimization(): Promise<boolean> {
        if (Capacitor.getPlatform() !== 'android') {
            return true; // iOS doesn't have this issue
        }

        try {
            // This would need a native plugin to check battery optimization status
            // For now, we'll request it directly
            const result = await this.requestBatteryOptimization();
            return result;
        } catch (error) {
            console.error('Failed to check battery optimization:', error);
            return false;
        }
    },

    async requestBatteryOptimization(): Promise<boolean> {
        if (Capacitor.getPlatform() !== 'android') {
            return true;
        }

        try {
            // Show dialog to explain why we need this
            const { value } = await Dialog.confirm({
                title: 'Optimalkan Notifikasi',
                message: 'Untuk memastikan notifikasi sholat tepat waktu, kami membutuhkan izin untuk mengabaikan optimasi baterai. Ini akan mencegah delay notifikasi.',
                okButtonTitle: 'Izinkan',
                cancelButtonTitle: 'Nanti Saja'
            });

            if (value) {
                // Try to open battery optimization settings
                try {
                    // Open device settings
                    await Browser.open({ url: 'intent:#Intent;action=android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS;end' });
                    return true;
                } catch (error) {
                    console.error('Failed to open battery settings:', error);
                    // Fallback to general settings
                    try {
                        await Browser.open({ url: 'intent:#Intent;action=android.settings.SETTINGS;end' });
                        return true;
                    } catch (fallbackError) {
                        console.error('Failed to open fallback settings:', fallbackError);
                        return false;
                    }
                }
            }
            
            return false;
        } catch (error) {
            console.error('Failed to request battery optimization:', error);
            return false;
        }
    },

    async showBatteryOptimizationInfo(): Promise<void> {
        if (Capacitor.getPlatform() !== 'android') {
            return;
        }

        try {
            await Dialog.alert({
                title: 'Notifikasi Tertunda?',
                message: 'Jika notifikasi sholat sering terlambat, silakan nonaktifkan optimasi baterai untuk aplikasi ini di pengaturan.',
                buttonTitle: 'Mengerti'
            });
        } catch (error) {
            console.error('Failed to show battery optimization info:', error);
        }
    }
};