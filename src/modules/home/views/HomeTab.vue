<template>
  <ion-page>
    <ion-content :fullscreen="true" class="ion-padding-bottom">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Header Section -->
      <div class="header-section ion-padding-top ion-padding-horizontal safe-area-top">
        <div class="header-top">
          <div class="greeting">
            <h1 class="text-gradient">{{ greetingText }}</h1>
            <p>{{ currentDate }}</p>
          </div>
          <div class="hijri-chip glass-effect">
            {{ hijriDate }}
          </div>
        </div>
      </div>

      <!-- Hero Card: Next Prayer -->
      <div class="hero-card premium-card ion-margin">
        <div class="card-overlay"></div>
        <div class="prayer-info">
          <div class="location-chip glass-effect" @click="refreshLocation">
            <ion-icon :icon="location" />
            <span>{{ locationName || $t('home.auto_detected') }}</span>
            <ion-icon :icon="refresh" class="refresh-icon" />
          </div>
          <span class="label">{{ $t('home.next_prayer') }}</span>
          <h2 v-if="nextPrayer" class="animate-text">{{ $t(`prayers.${nextPrayer.name.toLowerCase()}`) }}</h2>
          <h2 v-else>...</h2>
          <div class="time-display" v-if="nextPrayer">
            <span class="time">{{ nextPrayer.time }}</span>
            <span class="countdown-badge glass-effect">{{ formatDuration(nextPrayer.remaining) }} {{ $t('home.countdown_suffix') }}</span>
          </div>
        </div>
        <div class="icon-bg-float">
          <ion-icon :icon="moon" />
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions-grid ion-margin-horizontal">
        <div class="action-item" @click="router.push('/tabs/worship/prayer-times')">
          <div class="icon-wrapper primary-bg">
            <ion-icon :icon="time" />
          </div>
          <span>{{ $t('home.prayer_times') }}</span>
        </div>
        <div class="action-item" @click="router.push('/tabs/worship/dzikir')">
          <div class="icon-wrapper secondary-bg">
            <ion-icon :icon="fingerPrint" />
          </div>
          <span>{{ $t('home.dzikir') }}</span>
        </div>
        <div class="action-item" @click="router.push('/tabs/worship/qibla')">
          <div class="icon-wrapper tertiary-bg">
            <ion-icon :icon="compass" />
          </div>
          <span>{{ $t('home.qibla') }}</span>
        </div>
        <div class="action-item" @click="router.push('/tabs/quran')">
          <div class="icon-wrapper quaternary-bg">
            <ion-icon :icon="book" />
          </div>
          <span>{{ $t('tabs.quran') }}</span>
        </div>
      </div>

      <!-- Daily Inspiration -->
      <div class="inspiration-section ion-margin" v-if="randomAyah">
        <div class="section-header">
          <h3>{{ $t('home.inspiration_today') }}</h3>
          <ion-button fill="clear" size="small" @click="toggleAudio(randomAyah)" class="audio-btn">
            <ion-icon :icon="playingAyahNumber === randomAyah.ayah.nomorAyat ? pause : play" slot="icon-only" />
          </ion-button>
        </div>
        <div class="inspiration-card premium-card">
          <div class="ayah-text" dir="rtl">{{ randomAyah.ayah.teksArab }}</div>
          <div class="transliteration-text" v-if="randomAyah.ayah.teksLatin">
            {{ randomAyah.ayah.teksLatin }}
          </div>
          <div class="ayah-translation">"{{ randomAyah.ayah.teksIndonesia }}"</div>
          <div class="ayah-source">{{ randomAyah.surah.namaLatin }}:{{ randomAyah.ayah.nomorAyat }}</div>
        </div>
      </div>

      <div class="footer-info ion-padding-bottom ion-text-center">
        <p>MuslimHub v1.0.1 • {{ $t('home.footer_tagline') }}</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent, IonRefresher, IonRefresherContent, IonIcon, IonButton, useIonRouter } from '@ionic/vue';
import { time, fingerPrint, compass, location, moon, book, play, pause, refresh } from 'ionicons/icons';
import { computed, onMounted, ref, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { PrayerTimeService } from '@/modules/worship/services/prayer-times';
import { QuranService, Surah, Ayah, getAyahAudioUrl, getSurahAudioUrl } from '@/modules/quran/services/quran-api';
import { SmartLocationService } from '@/shared/services/smart-location';

const router = useIonRouter();
const { locale, t } = useI18n();

const nextPrayer = ref<{ name: string, time: string, remaining: number } | null>(null);
const locationName = ref<string>('');
const randomAyah = ref<{ surah: Surah, ayah: Ayah } | null>(null);
const currentAudio = ref<HTMLAudioElement | null>(null);
const playingAyahNumber = ref<number | null>(null);

const currentDate = computed(() => {
  return new Date().toLocaleDateString(locale.value, { weekday: 'long', day: 'numeric', month: 'long' });
});

const hijriDate = computed(() => {
  const lang = locale.value === 'en' ? 'en-US-u-ca-islamic-umalqura' : 'id-ID-u-ca-islamic-umalqura';
  return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
});

const greetingText = computed(() => {
  const hour = new Date().getHours();
  if (hour < 11) return t('home.greeting_morning');
  if (hour < 15) return t('home.greeting_afternoon');
  if (hour < 19) return t('home.greeting_evening');
  return t('home.greeting_night');
});

const cachedPrayerTimes = ref<any>(null);

const loadData = async () => {
  try {
    randomAyah.value = await QuranService.getRandomAyah();
    
    // Dapatkan lokasi dengan cepat (menggunakan cache jika tersedia)
    const location = await SmartLocationService.getLocation();
    
    // Tampilkan jadwal sholat dengan lokasi yang tersedia
    const times = await PrayerTimeService.getPrayerTimes(location.latitude, location.longitude);
    if (times) {
      cachedPrayerTimes.value = times;
      nextPrayer.value = await PrayerTimeService.getNextPrayer(times);
      locationName.value = times.city || location.city || '';
    }
    
    // Update lokasi di background jika menggunakan cache atau default
    if (location.source !== 'gps') {
      SmartLocationService.updateLocationInBackground();
    }
    
  } catch (e) {
    console.error('Load data failed', e);
  }
};

const handleRefresh = async (event: CustomEvent) => {
  await loadData();
  // Restart countdown timer after refresh
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  countdownInterval = setInterval(updateCountdown, 30000);
  event.detail.complete();
};

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const toggleAudio = (item: { surah: Surah, ayah: Ayah }) => {
  const { surah, ayah } = item;

  // If clicking the current playing ayah
  if (playingAyahNumber.value === ayah.nomorAyat && currentAudio.value) {
    currentAudio.value.pause();
    playingAyahNumber.value = null;
    return;
  }

  // Stop previous audio if exists
  if (currentAudio.value) {
    currentAudio.value.pause();
    currentAudio.value = null;
  }

  let audioUrl = getAyahAudioUrl(ayah);
  if (!audioUrl) {
    audioUrl = getSurahAudioUrl(surah);
  }

  if (!audioUrl) {
    console.warn('No audio found for this ayah');
    return;
  }

  const audio = new Audio(audioUrl);
  
  audio.onended = () => {
    playingAyahNumber.value = null;
  };
  
  audio.onerror = (e) => {
    console.error('Audio playback error', e);
    playingAyahNumber.value = null;
  };

  currentAudio.value = audio;
  playingAyahNumber.value = ayah.nomorAyat;
  audio.play().catch((error) => {
    console.error('Audio play rejected', error);
    playingAyahNumber.value = null;
  });
};

const refreshLocation = async () => {
  try {
    // Clear cache dan force update lokasi
    await SmartLocationService.clearCache();
    const location = await SmartLocationService.getLocation();
    
    // Update jadwal sholat dengan lokasi baru
    const times = await PrayerTimeService.getPrayerTimes(location.latitude, location.longitude, { force: true });
    if (times) {
      nextPrayer.value = await PrayerTimeService.getNextPrayer(times);
      locationName.value = times.city || location.city || '';
    }
  } catch (e) {
    console.error('Refresh location failed', e);
  }
};

const updateCountdown = () => {
  // Recalculate next prayer based on current time
  if (cachedPrayerTimes.value) {
    PrayerTimeService.getNextPrayer(cachedPrayerTimes.value).then(result => {
      if (result) {
        nextPrayer.value = result;
      }
    });
  }
};

let countdownInterval: NodeJS.Timeout | null = null;

onMounted(() => {
  loadData();
  countdownInterval = setInterval(updateCountdown, 30000); // Update every 30 seconds
});

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
});
</script>

<style scoped>
.header-section {
  padding-top: calc(var(--ion-safe-area-top, 20px) + 10px);
}
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}
.greeting {
  flex: 1;
  min-width: 0;
}
.greeting h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 800;
  line-height: 1.1;
}
.greeting p {
  margin: 4px 0 0;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
  font-weight: 500;
}
.hijri-chip {
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--ion-color-primary);
  max-width: 48%;
  text-align: left;
  line-height: 1.3;
  white-space: normal;
  align-self: flex-start;
}

/* Hero Card Redesign */
.hero-card {
  height: 200px;
  background: linear-gradient(135deg, #065f46 0%, #10b981 100%);
  padding: 24px;
  color: white;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: none;
}

.card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('https://www.transparenttextures.com/patterns/cubes.png');
  opacity: 0.1;
  pointer-events: none;
}

.location-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  width: fit-content;
  padding: 4px 10px;
  border-radius: 20px;
  margin-bottom: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.location-chip:active {
  transform: scale(0.95);
}

.refresh-icon {
  font-size: 0.9rem;
  opacity: 0.7;
  transition: transform 0.3s ease;
}

.location-chip:active .refresh-icon {
  transform: rotate(180deg);
}

.prayer-info .label {
  opacity: 0.8;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 700;
}
.prayer-info h2 {
  margin: 4px 0;
  font-size: 2.6rem;
  font-weight: 900;
  letter-spacing: -1px;
}
.time-display {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}
.time-display .time {
  font-size: 1.2rem;
  font-weight: 700;
}
.countdown-badge {
  font-size: 0.8rem;
  padding: 4px 12px;
  border-radius: 8px;
  font-weight: 600;
}

.icon-bg-float {
  position: absolute;
  right: -20px;
  bottom: -30px;
  opacity: 0.2;
  font-size: 10rem;
  transform: rotate(-15deg);
  pointer-events: none;
}

/* Quick Actions Redesign */
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 24px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.icon-wrapper {
  width: 68px;
  height: 68px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  box-shadow: 0 8px 20px rgba(0,0,0,0.06);
  transition: var(--transition-smooth);
}

.action-item:active .icon-wrapper {
  transform: scale(0.9) translateY(4px);
}

.primary-bg { background: #ecfdf5; color: #059669; }
.secondary-bg { background: #f0fdfa; color: #0d9488; }
.tertiary-bg { background: #fffbeb; color: #d97706; }
.quaternary-bg { background: #eef2ff; color: #4f46e5; }

.action-item span {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--ion-color-dark);
  text-align: center;
  line-height: 1.25;
  min-height: 2.4em;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

/* Inspiration Section */
.inspiration-section {
  margin-top: 40px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.section-header h3 {
  font-size: 1.2rem;
  font-weight: 800;
  padding-left: 4px;
}
.audio-btn {
  --padding-start: 8px;
  --padding-end: 8px;
  margin: 0;
}
.inspiration-card {
  background: var(--ion-card-background);
  padding: 24px;
  border: 1px solid var(--ion-border-color);
}
.ayah-text {
  font-size: 1.6rem;
  line-height: 2.4;
  text-align: right;
  margin-bottom: 16px;
  font-family: var(--arabic-font);
  color: var(--ion-color-dark);
}
.transliteration-text {
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--ion-color-medium);
  margin-bottom: 16px;
  font-style: italic;
  text-align: right;
}
.ayah-translation {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--ion-color-step-600);
  margin-bottom: 16px;
  font-weight: 400;
}
.ayah-source {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--ion-color-primary);
  text-align: right;
}

.footer-info p {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
  margin-top: 32px;
}

/* Animations */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.header-section, .hero-card, .quick-actions-grid, .inspiration-section {
  animation: fadeInUp 0.6s ease-out both;
}

.hero-card { animation-delay: 0.1s; }
.quick-actions-grid { animation-delay: 0.2s; }
.inspiration-section { animation-delay: 0.3s; }
</style>
