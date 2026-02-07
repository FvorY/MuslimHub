<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet, useBackButton, useIonRouter, toastController } from '@ionic/vue';
import { App } from '@capacitor/app';
import { useI18n } from 'vue-i18n';
import { ref, onMounted } from 'vue';
import { Preferences } from '@capacitor/preferences';

const ionRouter = useIonRouter();
const { t } = useI18n();
const lastBackPress = ref(0);

onMounted(async () => {
  const { value } = await Preferences.get({ key: 'darkMode' });
  // Default to true (dark) if not set
  const isDark = value === null ? true : value === 'true';
  document.body.classList.toggle('dark', isDark);

  // Initialize background notifications
  try {
    const { NotificationService } = await import('@/shared/services/notification');
    await NotificationService.initializeBackgroundNotifications();
    console.log('Background notifications initialized');
  } catch (error) {
    console.error('Failed to initialize background notifications:', error);
  }

  // Refresh prayer notifications when app opens
  try {
    const { PrayerTimeService } = await import('@/modules/worship/services/prayer-times');
    const { NotificationService } = await import('@/shared/services/notification');
    const { GeolocationService } = await import('@/shared/services/geolocation');
    const { Preferences } = await import('@capacitor/preferences');
    
    const { value: reminderEnabled } = await Preferences.get({ key: 'prayerReminder' });
    
    if (reminderEnabled === 'true') {
      const pos = await GeolocationService.getCurrentPosition().catch(() => null);
      if (pos) {
        const times = await PrayerTimeService.getPrayerTimes(pos.coords.latitude, pos.coords.longitude);
        if (times) {
          await NotificationService.updatePrayerNotifications(times);
          console.log('Prayer notifications refreshed on app open');
        }
      }
    }
  } catch (error) {
    console.error('Failed to refresh notifications on app open:', error);
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
