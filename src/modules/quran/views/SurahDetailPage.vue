<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="detail-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/quran" text=""></ion-back-button>
        </ion-buttons>
        <ion-title v-if="surah" class="text-gradient">
           {{ surah.namaLatin }}
        </ion-title>
        <ion-title v-else>{{ t('quran.loading_surah') }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="toggleFullSurahPlay" fill="clear">
            <ion-icon :icon="isFullSurahPlaying ? pauseCircle : playCircle" slot="icon-only" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <!-- <ion-header class="ion-no-border translucent-header">
      <ion-toolbar class="transparent-toolbar">
        <ion-buttons :slot="'start'">
          <ion-back-button default-href="/tabs/quran" text="" class="back-btn"></ion-back-button>
        </ion-buttons>
        <ion-title class="text-gradient">{{ surah.namaLatin }}</ion-title>
      </ion-toolbar>
    </ion-header> -->

    <ion-content :fullscreen="true" class="quran-bg">
      <div v-if="loading" class="loading-state">
        <ion-spinner color="primary"></ion-spinner>
      </div>

      <div v-else-if="surah" class="surah-container ion-padding-bottom">
        
        <!-- Bismillah Header -->
        <div class="surah-header-card ion-margin">
           <div class="surah-info-glass glass-effect">
              <div class="surah-type">{{ surah.tempatTurun }} • {{ t('quran.ayah_count', { count: surah.jumlahAyat }) }}</div>
              <img 
                v-if="surah.nomor !== 9"
                src="https://upload.wikimedia.org/wikipedia/commons/2/27/Basmala.svg" 
                alt="Bismillah" 
                class="bismillah-img" 
              />
           </div>
        </div>

        <div class="ayah-list">
          <div v-for="(ayat, index) in surah.ayat" :key="ayat.nomorAyat" :id="`ayah-${index}`" class="ayah-block">
            <div class="ayah-header">
               <div class="ayah-number-tag">{{ surah.nomor }}:{{ ayat.nomorAyat }}</div>
               <div class="ayah-actions-dots">
                 <ion-button fill="clear" size="small" @click="toggleAudio(ayat)">
                   <ion-icon :icon="playingAyahNumber === ayat.nomorAyat ? pause : play" slot="icon-only" />
                 </ion-button>
                 <ion-button fill="clear" size="small" @click="setLastReadMark(ayat)">
                   <ion-icon :icon="lastReadAyahNumber === ayat.nomorAyat ? bookmark : bookmarkOutline" slot="icon-only" />
                 </ion-button>
               </div>
            </div>
            
            <div class="ayah-content">
               <div class="arabic-text-premium" dir="rtl">{{ ayat.teksArab }}</div>
               <div class="transliteration-text">
                  {{ ayat.teksLatin }}
               </div>
               <div class="translation-premium">
                  <p>{{ ayat.teksIndonesia }}</p>
               </div>
               <div v-if="lastReadAyahNumber === ayat.nomorAyat" class="last-read-label">
                 {{ t('quran.last_read') }}
               </div>
            </div>
          </div>
        </div>

        <div class="navigation-footer ion-padding ion-text-center">
           <p class="finish-text">{{ t('quran.end_of_surah', { name: surah.namaLatin }) }}</p>
        </div>

        <!-- Full Surah Audio Controls -->
        <div v-if="isFullSurahPlaying || currentAyahIndex !== null" class="audio-controls-bar">
          <div class="audio-controls">
            <ion-button fill="clear" size="small" @click="quranAudioPlayer.previousAyah()">
              <ion-icon :icon="playSkipBack" slot="icon-only" />
            </ion-button>
            <ion-button fill="clear" size="small" @click="toggleFullSurahPlay">
              <ion-icon :icon="isFullSurahPlaying ? pauseCircle : playCircle" slot="icon-only" />
            </ion-button>
            <ion-button fill="clear" size="small" @click="quranAudioPlayer.nextAyah()">
              <ion-icon :icon="playSkipForward" slot="icon-only" />
            </ion-button>
          </div>
          <div class="ayah-progress">
            <span v-if="currentAyahIndex !== null && surah">
              {{ t('quran.ayah_progress', { current: currentAyahIndex + 1, total: surah.ayat.length }) }}
            </span>
          </div>
        </div>

      </div>

      <div v-else class="error-state ion-padding ion-text-center">
        <p>{{ t('quran.failed_load_surah') }}</p>
        <ion-button fill="clear" @click="loadDetail">{{ t('common.retry') }}</ion-button>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
  import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonSpinner, IonIcon, IonButton } from '@ionic/vue';
import { play, pause, playCircle, pauseCircle, playSkipBack, playSkipForward, bookmark, bookmarkOutline } from 'ionicons/icons';
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { QuranService, SurahDetail, Ayah } from '@/modules/quran/services/quran-api';
import { quranAudioPlayer } from '@/modules/quran/services/quran-audio-player';
import { backgroundAudioService } from '@/shared/services/background-audio';
import { capacitorBackgroundAudioService } from '@/shared/services/capacitor-background-audio';
import { QuranReadingProgressService } from '@/modules/quran/services/quran-reading-progress';

const route = useRoute();
const { t } = useI18n();
const surah = ref<SurahDetail | null>(null);
const loading = ref(true);

const currentAudio = ref<HTMLAudioElement | null>(null);
const playingAyahNumber = ref<number | null>(null);
const lastReadAyahNumber = ref<number | null>(null);

// Full surah audio state
const isFullSurahPlaying = ref(false);
const currentAyahIndex = ref<number | null>(null);

const toggleAudio = (ayah: Ayah) => {
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

    // Get audio URL (handling equran.id format which usually has '01', '02', etc for reciters)
    // Defaulting to '05' (Misyari) or the first available key
    let audioUrl = '';
    if (typeof ayah.audio === 'string') {
        audioUrl = ayah.audio;
    } else if (typeof ayah.audio === 'object' && ayah.audio !== null) {
        audioUrl = ayah.audio['05'] || Object.values(ayah.audio)[0] as string;
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
    audio.play();
};

// Full surah audio controls
const toggleFullSurahPlay = () => {
    if (!surah.value || !surah.value.ayat.length) return;
    
    if (isFullSurahPlaying.value) {
        quranAudioPlayer.pause();
    } else {
        // Start playing from beginning or resume from current position
        const startIndex = currentAyahIndex.value !== null ? currentAyahIndex.value : 0;
        quranAudioPlayer.playSurah(surah.value.ayat, surah.value.nomor, startIndex);
        
        // Request audio focus and enable background playback
        enableBackgroundAudio();
    }
};

// Setup audio player callbacks
const setupAudioPlayer = () => {
    quranAudioPlayer.setCallbacks({
        onPlayStateChange: (isPlaying: boolean) => {
            isFullSurahPlaying.value = isPlaying;
        },
        onAyahChange: (ayahIndex: number) => {
            currentAyahIndex.value = ayahIndex;
            // Update individual ayah playing state
            if (surah.value && surah.value.ayat[ayahIndex]) {
                playingAyahNumber.value = surah.value.ayat[ayahIndex].nomorAyat;
            }
        },
        onComplete: () => {
            isFullSurahPlaying.value = false;
            currentAyahIndex.value = null;
            playingAyahNumber.value = null;
            // Disable background audio when playback completes
            backgroundAudioService.disableBackgroundAudio();
            capacitorBackgroundAudioService.disableBackgroundMode();
        },
        onError: (error: string) => {
            console.error('Full surah audio error:', error);
            isFullSurahPlaying.value = false;
        },
        onScrollToAyah: (ayahIndex: number) => {
            scrollToAyah(ayahIndex);
        }
    });
};

// Auto-scroll to ayah
const scrollToAyah = (ayahIndex: number) => {
    const ayahElement = document.getElementById(`ayah-${ayahIndex}`);
    if (ayahElement) {
        // Scroll with smooth animation
        ayahElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center', // Center the ayah in the viewport
            inline: 'nearest'
        });
        
        // Add highlight effect temporarily
        ayahElement.classList.add('ayah-highlight');
        setTimeout(() => {
            ayahElement.classList.remove('ayah-highlight');
        }, 2000);
    }
};

const loadLastReadMark = async () => {
    const lastRead = await QuranReadingProgressService.getLastRead();
    if (!surah.value) return;
    if (lastRead?.surahNumber === surah.value.nomor) {
        lastReadAyahNumber.value = lastRead.ayahNumber;
        return;
    }
    lastReadAyahNumber.value = null;
};

const setLastReadMark = async (ayah: Ayah) => {
    if (!surah.value) return;
    await QuranReadingProgressService.setLastRead({
        surahNumber: surah.value.nomor,
        surahName: surah.value.namaLatin,
        ayahNumber: ayah.nomorAyat
    });
    lastReadAyahNumber.value = ayah.nomorAyat;
};

const scrollToAyahFromQuery = async () => {
    const ayah = Number(route.query.ayah);
    if (!ayah || ayah < 1) return;
    await nextTick();
    scrollToAyah(ayah - 1);
};

// Enable background audio playback
const enableBackgroundAudio = async () => {
    try {
        // Enable Capacitor background audio service
        await capacitorBackgroundAudioService.enableBackgroundMode();
        
        // Enable web background audio service as fallback
        backgroundAudioService.enableBackgroundAudio();
        
        // Set up media session with current surah info
        if (surah.value) {
            backgroundAudioService.setupMediaSession(
                surah.value.namaLatin,
                'Misyari Rasyid',
                [
                    { src: '/assets/icon/icon-192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/assets/icon/icon-512.png', sizes: '512x512', type: 'image/png' }
                ]
            );
        }
        
        // Set up media session handlers
        if ('mediaSession' in navigator) {
            (navigator as any).mediaSession.setActionHandler('play', () => {
                quranAudioPlayer.resume();
            });
            (navigator as any).mediaSession.setActionHandler('pause', () => {
                quranAudioPlayer.pause();
            });
            (navigator as any).mediaSession.setActionHandler('previoustrack', () => {
                quranAudioPlayer.previousAyah();
            });
            (navigator as any).mediaSession.setActionHandler('nexttrack', () => {
                quranAudioPlayer.nextAyah();
            });
        }
    } catch (error) {
        console.error('Failed to enable background audio:', error);
    }
};

const loadDetail = async () => {
    const nomor = Number(route.params.nomor);
    if (!nomor) return;
    
    loading.value = true;
    try {
      const data = await QuranService.getSurahDetail(nomor);
      surah.value = data;
      await loadLastReadMark();
      await scrollToAyahFromQuery();
    } catch (e) {
      console.error(e);
    } finally {
      loading.value = false;
    }
};

// Handle app visibility changes
const handleVisibilityChange = () => {
    if (document.hidden) {
        // App is going to background
        console.log('App going to background, audio should continue');
    } else {
        // App is coming to foreground
        console.log('App coming to foreground');
        // Ensure audio continues playing if it was playing
        if (isFullSurahPlaying.value && quranAudioPlayer.getState().isPlaying) {
            // Audio should already be playing, but we can ensure UI is in sync
            isFullSurahPlaying.value = true;
        }
    }
};

onMounted(() => {
    loadDetail();
    setupAudioPlayer();
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Handle page lifecycle events for better background support
    if ('wasDiscarded' in document) {
        // Handle page restoration after being discarded
        window.addEventListener('pageshow', (event) => {
            if (event.persisted || (event as any).wasDiscarded) {
                console.log('Page restored from cache/discarded state');
                // Re-sync audio state if needed
                if (isFullSurahPlaying.value) {
                    const state = quranAudioPlayer.getState();
                    currentAyahIndex.value = state.currentAyahIndex;
                }
            }
        });
    }
});

onUnmounted(() => {
    if (currentAudio.value) {
        currentAudio.value.pause();
        currentAudio.value = null;
    }
    quranAudioPlayer.destroy();
    
    // Disable background audio
    backgroundAudioService.disableBackgroundAudio();
    capacitorBackgroundAudioService.disableBackgroundMode();
    
    // Clean up event listeners
    document.removeEventListener('visibilitychange', handleVisibilityChange);
});
</script>

<style scoped>
.detail-toolbar {
  --background: var(--ion-background-color);
  --padding-top: 10px;
}

.surah-title-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.2;
}

.surah-title-meta .name {
  font-size: 1.1rem;
  font-weight: 800;
}

.surah-title-meta .translation {
  font-size: 0.7rem;
  font-weight: 500;
  opacity: 0.7;
  color: var(--ion-color-dark);
}

.surah-header-card {
  height: 140px;
  background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-secondary) 100%);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(var(--ion-color-primary-rgb), 0.2);
}

.surah-info-glass {
  width: 85%;
  height: 70%;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.surah-type {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--ion-text-color);
}

.bismillah-img {
    height: 32px;
}

body.dark .bismillah-img {
    filter: invert(1);
}

.ayah-list {
  padding: 0 16px;
}

.ayah-block {
    margin-bottom: 24px;
    background: var(--ion-card-background);
    border-radius: 20px;
    padding: 20px;
    border: 1px solid var(--ion-border-color);
    box-shadow: 0 4px 12px rgba(0,0,0,0.02);
}

.ayah-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.ayah-number-tag {
    background: rgba(var(--ion-color-primary-rgb), 0.1);
    color: var(--ion-color-primary);
    padding: 4px 12px;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 800;
}

.ayah-actions-dots {
  color: var(--ion-color-medium);
  font-size: 1.2rem;
}

.arabic-text-premium {
    font-family: var(--arabic-font);
    font-size: 2rem;
    text-align: right;
    line-height: 2.5;
    color: var(--ion-color-dark);
    margin-bottom: 16px;
}

.transliteration-text {
  font-size: 0.95rem;
  color: var(--ion-color-primary);
  font-style: italic;
  margin-bottom: 12px;
  opacity: 0.9;
  line-height: 1.6;
}

.translation-premium {
    font-size: 1rem;
    color: var(--ion-color-step-700);
    line-height: 1.7;
    font-weight: 450;
    border-top: 1px dashed var(--ion-border-color);
    padding-top: 16px;
}

.last-read-label {
  margin-top: 12px;
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(var(--ion-color-primary-rgb), 0.1);
  color: var(--ion-color-primary);
  font-size: 0.75rem;
  font-weight: 700;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 60px;
}

.finish-text {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  font-weight: 600;
  margin-top: 20px;
}

.error-state {
  padding-top: 60px;
}

.audio-controls-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid var(--ion-border-color);
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 1000;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
}

.audio-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.ayah-progress {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  font-weight: 500;
}

/* Add padding to content when audio controls are visible */
.ion-content::part(scroll) {
  padding-bottom: 80px;
}

/* Auto-scroll highlight animation */
.ayah-highlight {
  animation: highlightAyah 2s ease-in-out;
}

@keyframes highlightAyah {
  0% {
    background-color: transparent;
    transform: scale(1);
  }
  25% {
    background-color: rgba(var(--ion-color-primary-rgb), 0.1);
    transform: scale(1.02);
    box-shadow: 0 0 20px rgba(var(--ion-color-primary-rgb), 0.2);
  }
  75% {
    background-color: rgba(var(--ion-color-primary-rgb), 0.1);
    transform: scale(1.02);
    box-shadow: 0 0 20px rgba(var(--ion-color-primary-rgb), 0.2);
  }
  100% {
    background-color: transparent;
    transform: scale(1);
    box-shadow: none;
  }
}
</style>
