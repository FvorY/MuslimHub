<template>
  <ion-page>
    <!-- <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title class="page-title">{{ $t('tabs.settings') }}</ion-title>
      </ion-toolbar>
    </ion-header> -->

    <ion-content :fullscreen="true">
       <br>
      <div class="content-wrapper">
        <header class="hero-section">
          <h1 class="text-gradient">{{ $t('tabs.settings') }}</h1>
          <p class="subtitle">{{ $t('settings.subtitle') }}</p>
        </header>

        <section class="settings-group">
          <h2 class="group-title">{{ $t('settings.general') }}</h2>
          <div class="settings-card premium-card">
            <div class="setting-item">
              <div class="icon-wrapper gradient-dark">
                <ion-icon :icon="moon"></ion-icon>
              </div>
              <div class="setting-info">
                <h3>{{ $t('settings.dark_mode') }}</h3>
                <p>{{ $t('settings.dark_mode_description') }}</p>
              </div>
              <ion-toggle :checked="isDark" @ionChange="toggleDark"></ion-toggle>
            </div>

            <div class="setting-item">
              <div class="icon-wrapper gradient-notification">
                <ion-icon :icon="notifications"></ion-icon>
              </div>
              <div class="setting-info">
                <h3>{{ $t('settings.prayer_reminder') }}</h3>
                <p>{{ $t('settings.prayer_reminder_description') }}</p>
              </div>
              <ion-toggle :checked="isReminder" @ionChange="toggleReminder"></ion-toggle>
            </div>

            <div class="setting-item" v-if="isReminder" @click="showNotificationHelp">
              <div class="icon-wrapper gradient-notification">
                <ion-icon :icon="informationCircle"></ion-icon>
              </div>
              <div class="setting-info">
                <h3>{{ $t('settings.notification_help') }}</h3>
                <p>{{ $t('settings.notification_help_description') }}</p>
              </div>
              <ion-icon :icon="chevronForward" color="medium"></ion-icon>
            </div>

            <div class="setting-item">
              <div class="icon-wrapper gradient-language">
                <ion-icon :icon="language"></ion-icon>
              </div>
              <div class="setting-info">
                <h3>{{ $t('settings.language') }}</h3>
                <p>{{ $t('settings.language_description') }}</p>
              </div>
              <ion-select :value="locale" @ionChange="changeLang($event.detail.value)" interface="popover">
                <ion-select-option value="en">English</ion-select-option>
                <ion-select-option value="id"> Indonesia</ion-select-option>
              </ion-select>
            </div>
          </div>
        </section>

        <section class="settings-group">
          <h2 class="group-title">{{ $t('settings.about') }}</h2>
          <div class="settings-card premium-card">
            <div class="setting-item info-item">
              <div class="app-logo">
                <ion-icon :icon="notifications" style="color: white; font-size: 24px;"></ion-icon>
              </div>
              <div class="setting-info">
                <h3>MuslimHub</h3>
                <p>{{ $t('settings.app_version', { version: '0.1.0' }) }}</p>
                <p class="small">{{ $t('settings.app_build_info') }}</p>
              </div>
            </div>
          </div>
        </section>

        <div class="footer-note">
          <p>© 2026 MuslimHub. {{ $t('settings.footer_note') }}</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent, IonIcon, IonToggle, IonSelect, IonSelectOption } from '@ionic/vue';
import { moon, language, notifications, informationCircle, chevronForward } from 'ionicons/icons';
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Preferences } from '@capacitor/preferences';
import { NotificationService } from '@/shared/services/notification';
import { PrayerTimeService } from '@/modules/worship/services/prayer-times';
import { GeolocationService } from '@/shared/services/geolocation';

const { locale } = useI18n();
const isDark = ref(false);

const toggleDark = async (event: any) => {
  isDark.value = event.detail.checked;
  document.body.classList.toggle('dark', isDark.value);
  await Preferences.set({
    key: 'darkMode',
    value: isDark.value ? 'true' : 'false'
  });
  // Also update localStorage for immediate sync
  try {
    localStorage.setItem('darkMode', isDark.value ? 'true' : 'false');
  } catch (e) {
    console.warn('Failed to update localStorage:', e);
  }
};

const isReminder = ref(false);

const toggleReminder = async (event: any) => {
  const enabled = event.detail.checked;
  isReminder.value = enabled;

  if (enabled) {
    const granted = await NotificationService.requestPermissions();
    if (granted) {
      try {
        // Initialize background notifications
        await NotificationService.initializeBackgroundNotifications();
        const exactAlarmGranted = await NotificationService.checkExactAlarmPermission();
        if (!exactAlarmGranted) {
          await NotificationService.requestExactAlarmPermission();
        }
        
        const pos = await GeolocationService.getCurrentPosition();
        const times = await PrayerTimeService.getPrayerTimes(pos.coords.latitude, pos.coords.longitude);
        if (times) {
          await NotificationService.updatePrayerNotifications(times, { force: true });
        }
      } catch (e) {
        console.error('Failed to schedule notifications', e);
      }
    } else {
      isReminder.value = false;
    }
  } else {
    await NotificationService.cancelAllNotifications();
  }

  await Preferences.set({
    key: 'prayerReminder',
    value: isReminder.value ? 'true' : 'false'
  });
};

const showNotificationHelp = async () => {
  try {
    await NotificationService.showNotificationTroubleshooting();
  } catch (error) {
    console.error('Failed to show notification help:', error);
  }
};

const changeLang = (val: string) => {
  locale.value = val;
};

onMounted(async () => {
  const { value } = await Preferences.get({ key: 'darkMode' });
  if (value === null) {
    isDark.value = true;
    await Preferences.set({ key: 'darkMode', value: 'true' });
  } else {
    isDark.value = value === 'true';
  }
  
  document.body.classList.toggle('dark', isDark.value);

  const { value: reminderVal } = await Preferences.get({ key: 'prayerReminder' });
  isReminder.value = reminderVal === 'true';

  // Cleanup interval on unmount
  return () => {};
});
</script>

<style scoped>
.content-wrapper {
  padding: 24px;
}

.hero-section {
  margin-bottom: 32px;
}

.page-title {
  font-weight: 700;
}

.hero-section h1 {
  font-size: 32px;
  font-weight: 800;
  margin: 0 0 8px 0;
}

.hero-section .subtitle {
  color: var(--ion-color-medium);
  font-size: 15px;
  margin: 0;
}

.settings-group {
  margin-bottom: 24px;
}

.group-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-color-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 12px 12px;
}

.settings-card {
  background: var(--ion-background-color, #fff);
  border: 1px solid var(--ion-color-step-100, #f0f0f0);
}

.setting-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--ion-color-step-100, #f0f0f0);
  gap: 12px;
}

.setting-item:last-child {
  border-bottom: none;
}

.icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.icon-wrapper ion-icon {
  font-size: 20px;
}

.gradient-dark {
  background: linear-gradient(135deg, #4b5563, #1f2937);
}

.gradient-notification {
  background: linear-gradient(135deg, #10b981, #059669);
}

.gradient-language {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.setting-info {
  flex: 1;
  min-width: 0; /* Important for flex truncation if needed */
}

.setting-info h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 2px 0;
  color: var(--ion-text-color);
}

.setting-info p {
  font-size: 13px;
  color: var(--ion-color-medium);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
}

.setting-info p.small {
  font-size: 11px;
  margin-top: 4px;
}

.info-item {
  padding: 24px 16px;
}

ion-toggle, ion-select {
  flex-shrink: 0;
  margin-left: auto;
}

ion-select {
  justify-items: right;
  --padding-start: 12px;
  --padding-end: 12px;
  --placeholder-color: var(--ion-color-primary);
  --placeholder-opacity: 1;
  font-weight: 600;
  color: var(--ion-color-primary);
  max-width: 160px;
  text-align: right;
}

/* Remove default Ionic select underline/border in modern Ionic versions */
ion-select::part(container) {
  border: none;
  padding: 0;
}

.app-logo {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--ion-color-primary);
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--premium-shadow);
  flex-shrink: 0;
}

.footer-note {
  text-align: center;
  margin-top: 40px;
  padding-bottom: 24px;
}

.footer-note p {
  font-size: 12px;
  color: var(--ion-color-medium);
  opacity: 0.7;
}

/* Dark mode adjustments */
body.dark .settings-card {
  background: var(--ion-card-background);
  border-color: var(--ion-color-step-150);
}

body.dark .setting-item {
  border-bottom-color: var(--ion-color-step-150);
}
</style>
