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
        <ion-title v-else>Memuat...</ion-title>
      </ion-toolbar>
    </ion-header>

    <!-- <ion-header class="ion-no-border translucent-header">
      <ion-toolbar class="transparent-toolbar">
        <ion-buttons slot="start">
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
              <div class="surah-type">{{ surah.tempatTurun }} • {{ surah.jumlahAyat }} Ayat</div>
              <img 
                v-if="surah.nomor !== 9"
                src="https://upload.wikimedia.org/wikipedia/commons/2/27/Basmala.svg" 
                alt="Bismillah" 
                class="bismillah-img" 
              />
           </div>
        </div>

        <div class="ayah-list">
          <div v-for="ayat in surah.ayat" :key="ayat.nomorAyat" class="ayah-block">
            <div class="ayah-header">
               <div class="ayah-number-tag">{{ surah.nomor }}:{{ ayat.nomorAyat }}</div>
               <div class="ayah-actions-dots">
                 <ion-button fill="clear" size="small" @click="toggleAudio(ayat)">
                   <ion-icon :icon="playingAyahNumber === ayat.nomorAyat ? pause : play" slot="icon-only" />
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
            </div>
          </div>
        </div>

        <div class="navigation-footer ion-padding ion-text-center">
           <p class="finish-text">Akhir dari Surah {{ surah.namaLatin }}</p>
        </div>

      </div>

      <div v-else class="error-state ion-padding ion-text-center">
        <p>Gagal memuat Surah.</p>
        <ion-button fill="clear" @click="loadDetail">Coba Lagi</ion-button>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonSpinner, IonIcon, IonButton } from '@ionic/vue';
import { ellipsisVertical, play, pause } from 'ionicons/icons';
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { QuranService, SurahDetail, Ayah } from '@/modules/quran/services/quran-api';

const route = useRoute();
const surah = ref<SurahDetail | null>(null);
const loading = ref(true);

const currentAudio = ref<HTMLAudioElement | null>(null);
const playingAyahNumber = ref<number | null>(null);

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

const loadDetail = async () => {
    const nomor = Number(route.params.nomor);
    if (!nomor) return;
    
    loading.value = true;
    try {
      const data = await QuranService.getSurahDetail(nomor);
      surah.value = data;
    } catch (e) {
      console.error(e);
    } finally {
      loading.value = false;
    }
};

onMounted(() => {
    loadDetail();
});

onUnmounted(() => {
    if (currentAudio.value) {
        currentAudio.value.pause();
        currentAudio.value = null;
    }
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
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(16, 185, 129, 0.2);
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
  color: white;
  opacity: 0.9;
}

.bismillah-img {
    height: 32px;
    filter: brightness(0) invert(1);
    opacity: 0.9;
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
</style>
