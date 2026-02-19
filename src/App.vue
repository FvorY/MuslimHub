<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet, useBackButton, useIonRouter, toastController } from '@ionic/vue';
import { App } from '@capacitor/app';
import { useI18n } from 'vue-i18n';
import { ref, onMounted, onUnmounted } from 'vue';
import { Preferences } from '@capacitor/preferences';

const ionRouter = useIonRouter();
const { t } = useI18n();
const lastBackPress = ref(0);
let appStateListener: { remove: () => Promise<void> } | null = null;

const ensureNotificationHealth = async (): Promise<boolean> => {
  try {
    const { NotificationService } = await import('@/shared/services/notification');
    const { value: reminderEnabled } = await Preferences.get({ key: 'prayerReminder' });
    if (reminderEnabled !== 'true') return false;

    const permissionGranted = await NotificationService.requestPermissions();
    if (!permissionGranted) {
      console.warn('Notification permission denied');
      return false;
    }

    await NotificationService.initializeBackgroundNotifications();
    await NotificationService.checkExactAlarmPermission();
    return true;
  } catch (error) {
    console.error('Failed to ensure notification health:', error);
    return false;
  }
};

const handleAppUpdateNotificationRecovery = async (): Promise<void> => {
  try {
    const appInfo = await App.getInfo();
    const currentBuild = appInfo.build ?? appInfo.version ?? 'unknown';
    const { value: lastKnownBuild } = await Preferences.get({ key: 'lastKnownAppBuild' });

    // If build changes, force refresh notifications because some vendors reset alarm/notification state on update.
    const appUpdated = !!lastKnownBuild && lastKnownBuild !== currentBuild;
    const canProceed = await ensureNotificationHealth();
    if (appUpdated && canProceed) {
      await refreshPrayerNotifications(true);
      console.log(`Notification recovery executed after app update (${lastKnownBuild} -> ${currentBuild})`);
    }

    await Preferences.set({ key: 'lastKnownAppBuild', value: currentBuild });
  } catch (error) {
    console.error('Failed app update notification recovery:', error);
  }
};

const refreshPrayerNotifications = async (force = false) => {
  try {
    const { PrayerTimeService } = await import('@/modules/worship/services/prayer-times');
    const { NotificationService } = await import('@/shared/services/notification');
    const { GeolocationService } = await import('@/shared/services/geolocation');
    
    const { value: reminderEnabled } = await Preferences.get({ key: 'prayerReminder' });
    
    if (reminderEnabled === 'true') {
      const pos = await GeolocationService.getCurrentPosition().catch(() => null);
      if (pos) {
        const times = await PrayerTimeService.getPrayerTimes(pos.coords.latitude, pos.coords.longitude, { force });
        if (times) {
          await NotificationService.updatePrayerNotifications(times, { force });
          console.log(`Prayer notifications refreshed (force=${force})`);
        }
      }
    }
  } catch (error) {
    console.error('Failed to refresh notifications:', error);
  }
};

onMounted(async () => {
  // Apply dark mode immediately
  const applyDarkMode = async () => {
    try {
      const { value } = await Preferences.get({ key: 'darkMode' });
      // Default to true (dark) if not set
      const isDark = value === null ? true : value === 'true';
      
      // Force apply dark mode class
      if (isDark) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
      
      console.log('Dark mode applied:', isDark);
    } catch (error) {
      console.error('Failed to apply dark mode:', error);
      // Default to dark mode on error
      document.body.classList.add('dark');
    }
  };

  // Apply dark mode on mount
  await applyDarkMode();

  // Check and request to disable battery optimization
  try {
    const { BatteryOptimizationService } = await import('@/shared/services/battery-optimization');
    const isOptimized = await BatteryOptimizationService.checkBatteryOptimization();
    if (isOptimized) {
      await BatteryOptimizationService.requestBatteryOptimization();
    }
    console.log('Battery optimization check complete');
  } catch (error) {
    console.error('Failed to check battery optimization:', error);
  }

  // Initialize background runner
  try {
    const { BackgroundRunnerService } = await import('@/shared/services/background-runner');
    await BackgroundRunnerService.init();
    console.log('Background runner initialized');
  } catch (error) {
    console.error('Failed to initialize background runner:', error);
  }

  // Initialize background notifications
  try {
    await ensureNotificationHealth();
    console.log('Background notifications health check complete');
  } catch (error) {
    console.error('Failed to initialize background notifications:', error);
  }

  // Force notification recovery after app update (first launch only)
  await handleAppUpdateNotificationRecovery();

  // Refresh prayer notifications when app opens
  await refreshPrayerNotifications(false);

  // Re-sync notifications whenever app returns to foreground.
  // This helps when user changes device time/timezone manually.
  appStateListener = await App.addListener('appStateChange', async ({ isActive }) => {
    if (isActive) {
      await refreshPrayerNotifications(true);
    }
  });
});

onUnmounted(async () => {
  if (appStateListener) {
    await appStateListener.remove();
    appStateListener = null;
  }
});

useBackButton(10, async () => {
  if (!ionRouter.canGoBack()) {
    // We are at root of a tab or the app
    const now = Date.now();
    if (now - lastBackPress.value < 2000) {
      App.exitApp();
    } else {
      lastBackPress.value = now;
      const toast = await toastController.create({
        message: t('common.back_again_to_exit'),
        duration: 2000,
        position: 'bottom'
      });
      await toast.present();
    }
  } else {
    // We can go back within the tab stack
    ionRouter.back();
  }
});
</script>
