<template>
  <ion-page>
    <ion-header class="ion-no-border translucent-header">
      <ion-toolbar class="transparent-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/worship" text="" class="back-btn"></ion-back-button>
        </ion-buttons>
        <ion-title class="text-gradient">{{ $t('home.prayer_times') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="prayer-header ion-padding">
        <div class="location-card premium-card" @click="detectLocation">
          <div class="card-bg-decoration"></div>
          <div class="location-content">
            <div class="location-tag glass-effect" @click="refreshLocation">
              <ion-icon :icon="location" />
              <span>{{ locationName || t('worship.prayer_location_detecting') }}</span>
              <ion-icon :icon="refresh" class="refresh-icon" />
            </div>
            <div class="date-info">
              <h2>{{ currentDate }}</h2>
              <p class="hijri-sub">{{ hijriDate }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="prayer-timeline ion-padding-horizontal">
        <div v-for="(time, name) in displayTimes" :key="String(name)" 
             class="prayer-card premium-card" 
             :class="{ active: isCurrent(String(name)) }">
          <div class="card-stain" v-if="isCurrent(String(name))"></div>
          <div class="prayer-left">
            <div class="prayer-icon-circle">
              <ion-icon :icon="getPrayerIcon(String(name))" />
            </div>
            <div class="prayer-names">
              <span class="prayer-name">{{ $t(`prayers.${String(name).toLowerCase()}`) }}</span>
              <span class="active-badge" v-if="isCurrent(String(name))">{{ t('worship.prayer_now') }}</span>
            </div>
          </div>
          <div class="prayer-right">
            <span class="prayer-time">{{ time }}</span>
            <div class="notification-toggle" :class="{ enabled: true }">
              <ion-icon :icon="notifications" />
            </div>
          </div>
        </div>
      </div>

      <div class="footer-note ion-padding ion-text-center">
        <p>{{ t('worship.prayer_based_on_device') }}</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonRefresher, IonRefresherContent, IonIcon } from '@ionic/vue';
import { location, notifications, partlySunny, sunny, moon, cloudyNight, refresh } from 'ionicons/icons';
import { onMounted, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PrayerTimeService, PrayerTimes } from '@/modules/worship/services/prayer-times';
import { SmartLocationService } from '@/shared/services/smart-location';

const { locale, t } = useI18n();
const times = ref<PrayerTimes | null>(null);
const locationName = ref<string>('');
const currentPrayerName = ref<string>('');

const currentDate = computed(() => {
  return new Date().toLocaleDateString(locale.value, { weekday: 'long', day: 'numeric', month: 'long' });
});

const hijriDate = computed(() => {
  return new Intl.DateTimeFormat('id-TN-u-ca-islamic-uma', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
});

const displayTimes = computed(() => {
  if (!times.value) return {};
  const { subuh, dzuhur, ashar, maghrib, isya } = times.value;
  return { subuh, dzuhur, ashar, maghrib, isya };
});

const getPrayerIcon = (name: string) => {
  switch (name.toLowerCase()) {
    case 'subuh': return moon;
    case 'dzuhur': return sunny;
    case 'ashar': return partlySunny;
    case 'maghrib': return cloudyNight; 
    case 'isya': return moon;
    default: return sunny;
  }
};

const isCurrent = (name: string) => {
  return currentPrayerName.value.toLowerCase() === name.toLowerCase();
};

const loadData = async () => {
  try {
    // Dapatkan lokasi dengan cepat (menggunakan cache jika tersedia)
    const location = await SmartLocationService.getLocation();
    
    // Tampilkan jadwal sholat dengan lokasi yang tersedia
    const result = await PrayerTimeService.getPrayerTimes(location.latitude, location.longitude);
    if (result) {
      times.value = result;
      locationName.value = result.city || location.city || t('worship.prayer_location_mine');
      updateCurrentPrayer(result);
    }
    
    // Update lokasi di background jika menggunakan cache atau default
    if (location.source !== 'gps') {
      SmartLocationService.updateLocationInBackground();
    }
  } catch (e) {
    console.error('Loc error', e);
  }
};

const updateCurrentPrayer = (prayerTimes: PrayerTimes) => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const parseTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const schedule = [
    { name: 'subuh', time: parseTime(prayerTimes.subuh) },
    { name: 'dzuhur', time: parseTime(prayerTimes.dzuhur) },
    { name: 'ashar', time: parseTime(prayerTimes.ashar) },
    { name: 'maghrib', time: parseTime(prayerTimes.maghrib) },
    { name: 'isya', time: parseTime(prayerTimes.isya) }
  ];

  let current = 'isya';
  for (let i = schedule.length - 1; i >= 0; i--) {
    if (currentTime >= schedule[i].time) {
      current = schedule[i].name;
      break;
    }
  }
  currentPrayerName.value = current;
};

const detectLocation = async () => {
   await loadData();
};

const refreshLocation = async () => {
  try {
    // Clear cache dan force update lokasi
    await SmartLocationService.clearCache();
    const location = await SmartLocationService.getLocation();
    
    // Update jadwal sholat dengan lokasi baru
    const result = await PrayerTimeService.getPrayerTimes(location.latitude, location.longitude, { force: true });
    if (result) {
      times.value = result;
      locationName.value = result.city || location.city || t('worship.prayer_location_mine');
      updateCurrentPrayer(result);
    }
  } catch (e) {
    console.error('Refresh location failed', e);
  }
};

const handleRefresh = async (event: CustomEvent) => {
  await loadData();
  event.detail.complete();
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.translucent-header {
  background: white;
  border-bottom: none;
}

.transparent-toolbar {
  --background: var(--ion-background-color);
  --border-width: 0;
}

.transparent-toolbar ion-title {
  font-weight: 800;
}

.back-btn {
  --color: var(--ion-color-primary);
}

.prayer-header {
  padding-top: 20px;
  padding-bottom: 24px;
}

.location-card {
  background: linear-gradient(135deg, #059669 0%, #14b8a6 100%);
  color: white;
  padding: 24px;
  position: relative;
  overflow: hidden;
  border: none;
}

.card-bg-decoration {
  position: absolute;
  top: -20px;
  right: -20px;
  width: 120px;
  height: 120px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  pointer-events: none;
}

.location-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.location-tag:active {
  transform: scale(0.95);
}

.refresh-icon {
  font-size: 0.9rem;
  opacity: 0.7;
  transition: transform 0.3s ease;
}

.location-tag:active .refresh-icon {
  transform: rotate(180deg);
}

.date-info h2 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 900;
  letter-spacing: -0.5px;
}

.hijri-sub {
  margin: 4px 0 0;
  font-size: 0.95rem;
  font-weight: 500;
  opacity: 0.8;
}

.prayer-timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prayer-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  background: var(--ion-card-background);
  border: 1px solid var(--ion-border-color);
  position: relative;
}

.prayer-card.active {
  border-color: var(--ion-color-primary);
  background: rgba(var(--ion-color-primary-rgb), 0.03);
  transform: scale(1.02);
  z-index: 10;
}

.card-stain {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--ion-color-primary);
}

.prayer-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.prayer-icon-circle {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: var(--ion-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: var(--ion-color-primary);
}

.active .prayer-icon-circle {
  background: var(--ion-color-primary);
  color: white;
}

.prayer-names {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.prayer-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ion-color-dark);
}

.active-badge {
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--ion-color-primary);
  text-transform: uppercase;
}

.prayer-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.prayer-time {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--ion-color-dark);
}

.notification-toggle {
  font-size: 1.3rem;
  color: var(--ion-color-step-300);
}

.notification-toggle.enabled {
  color: var(--ion-color-primary);
}

.footer-note {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  font-weight: 500;
  margin-top: 20px;
}

/* Animations */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.prayer-card {
  animation: fadeInUp 0.4s ease-out both;
}

.prayer-card:nth-child(1) { animation-delay: 0.1s; }
.prayer-card:nth-child(2) { animation-delay: 0.15s; }
.prayer-card:nth-child(3) { animation-delay: 0.2s; }
.prayer-card:nth-child(4) { animation-delay: 0.25s; }
.prayer-card:nth-child(5) { animation-delay: 0.3s; }

</style>
