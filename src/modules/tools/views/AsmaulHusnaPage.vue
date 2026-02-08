<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button default-href="/tabs/tools"></ion-back-button>
          </ion-buttons>
          <ion-title class="page-title">{{ $t('tools.asmaul_husna') }}</ion-title>
        </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="content-wrapper">
        <header class="hero-section">
          <h1 class="text-gradient">{{ $t('tools.asmaul_husna') }}</h1>
          <p class="subtitle">{{ $t('tools.asmaul_husna_description') }}</p>
          <div class="status-indicator">
          </div>
        </header>

        <section class="controls-section">
          <div class="audio-controls">
            <ion-button 
              expand="block" 
              @click="playFullAudio" 
              :disabled="isPlayingFullAudio"
              class="play-full-btn"
            >
              <ion-icon :icon="play"></ion-icon>
              {{ isPlayingFullAudio ? $t('common.playing') : $t('tools.play_full_asmaul_husna') }}
            </ion-button>
            
            <ion-button 
              v-if="isPlayingFullAudio"
              fill="outline" 
              expand="block" 
              @click="stopAudio"
              class="stop-btn"
            >
              <ion-icon :icon="stop"></ion-icon>
              {{ $t('common.stop') }}
            </ion-button>
          </div>

          <div class="search-filter">
            <ion-input
              v-model="searchQuery"
              :placeholder="$t('tools.asmaul_husna_search_placeholder')"
              clear-input
            />
          </div>
        </section>

        <section class="asmaul-husna-grid">
          <div 
            v-for="item in filteredAsmaulHusnaList" 
            :key="item.id"
            class="asmaul-husna-card"
            @click="selectItem(item)"
          >
            <div class="card-header">
              <span class="number">{{ item.id }}</span>
              <ion-button 
                fill="clear" 
                size="small"
                @click.stop="playIndividualAudio(item)"
                :disabled="currentPlayingId === item.id"
              >
                <ion-icon 
                  :icon="currentPlayingId === item.id ? volumeHigh : playCircle"
                ></ion-icon>
              </ion-button>
            </div>
            
            <div class="arabic-text">{{ item.arabic }}</div>
            <div class="transliteration">{{ item.transliteration }}</div>
            <div class="translation">{{ getCurrentTranslation(item) }}</div>
            <div class="meaning">{{ getCurrentMeaning(item) }}</div>
          </div>
        </section>
      </div>
    </ion-content>

    <!-- Detail Modal -->
    <ion-modal :is-open="selectedItem !== null" @did-dismiss="selectedItem = null">
      <div class="modal-content" v-if="selectedItem">
        <div class="modal-header">
          <h2>{{ selectedItem.transliteration }}</h2>
          <ion-button fill="clear" @click="selectedItem = null">
            <ion-icon :icon="close"></ion-icon>
          </ion-button>
        </div>
        
        <div class="modal-body">
          <div class="arabic-text large">{{ selectedItem.arabic }}</div>
          <div class="transliteration large">{{ selectedItem.transliteration }}</div>
          <div class="translation large">{{ getCurrentTranslation(selectedItem) }}</div>
          <div class="meaning">{{ getCurrentMeaning(selectedItem) }}</div>
          
          <div class="modal-actions">
            <ion-button expand="block" @click="playIndividualAudio(selectedItem)">
              <ion-icon :icon="play"></ion-icon>
              {{ $t('tools.play_audio') }}
            </ion-button>
          </div>
        </div>
      </div>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonModal, IonInput, toastController
} from '@ionic/vue';
import { 
  play, stop, playCircle, volumeHigh, close 
} from 'ionicons/icons';
import { AsmaulHusnaService, AsmaulHusnaItem } from '../services/asmaul-husna-service';

const { locale } = useI18n();

const asmaulHusnaList = ref<AsmaulHusnaItem[]>([]);
const searchQuery = ref('');
const isOnline = ref(true);
const isPlayingFullAudio = ref(false);
const currentPlayingId = ref<number | null>(null);
const selectedItem = ref<AsmaulHusnaItem | null>(null);

let audioElement: HTMLAudioElement | null = null;

const getCurrentTranslation = (item: AsmaulHusnaItem) => {
  const lang = locale.value as 'en' | 'id';
  const translation = (item.translation && item.translation[lang]) ? item.translation[lang] : '';
  return translation || item.transliteration || '';
};

const getCurrentMeaning = (item: AsmaulHusnaItem) => {
  const lang = locale.value as 'en' | 'id';
  const meaning = item.meaning && item.meaning[lang] ? item.meaning[lang] : '';
  return meaning;
};

const selectItem = (item: AsmaulHusnaItem) => {
  selectedItem.value = item;
};

const filteredAsmaulHusnaList = computed(() => {
  if (!searchQuery.value) {
    return asmaulHusnaList.value;
  }

  const query = searchQuery.value.toLowerCase().trim();

  return asmaulHusnaList.value.filter((item) => {
    const arabic = item.arabic.toLowerCase();
    const transliteration = item.transliteration.toLowerCase();

    return (
      arabic.includes(query) ||
      transliteration.includes(query) ||
      getCurrentTranslation(item).toLowerCase().includes(query)
    );
  });
});

const playAudio = (audioUrl: string, itemId?: number) => {
  // Stop any currently playing audio
  stopAudio();
  
  audioElement = new Audio(audioUrl);
  
  if (itemId) {
    currentPlayingId.value = itemId;
  } else {
    isPlayingFullAudio.value = true;
  }
  
  audioElement.play().catch(error => {
    console.error('Error playing audio:', error);
    resetAudioState();
  });
  
  audioElement.addEventListener('ended', resetAudioState);
  audioElement.addEventListener('error', resetAudioState);
};

const playIndividualAudio = (item: AsmaulHusnaItem) => {
  playAudio(item.audio.individual, item.id);
};

let currentSequentialIndex = 0;

const playSequentialAudio = async () => {
  if (currentSequentialIndex >= asmaulHusnaList.value.length) {
    console.log('Sequential playback completed - all 99 Asmaul Husna played');
    currentSequentialIndex = 0;
    resetAudioState();
    
    // Show completion notification
    toastController.create({
      message: 'Selesai memutar seluruh Asmaul Husna (99 nama)',
      duration: 3000,
      position: 'bottom',
      color: 'success'
    }).then(toast => toast.present());
    
    return;
  }

  const currentItem = asmaulHusnaList.value[currentSequentialIndex];
  if (!currentItem || !currentItem.audio.individual) {
    console.warn(`Audio not available for item ${currentSequentialIndex + 1}, skipping to next`);
    
    // Show notification for missing audio
    if (currentSequentialIndex === 0) {
      toastController.create({
        message: `Audio untuk ${currentItem?.transliteration || 'item'} tidak tersedia`,
        duration: 2000,
        position: 'bottom',
        color: 'warning'
      }).then(toast => toast.present());
    }
    
    // Skip to next item if current one is invalid
    currentSequentialIndex++;
    setTimeout(() => playSequentialAudio(), 1);
    return;
  }

  console.log(`Playing Asmaul Husna ${currentSequentialIndex + 1}: ${currentItem.transliteration}`);
  
  // Stop any currently playing audio and cleanup
  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
    audioElement = null;
  }
  
  audioElement = new Audio(currentItem.audio.individual);
  isPlayingFullAudio.value = true;
  
  // Set event handlers - simpler approach like Quran player
  audioElement.onended = () => {
    console.log(`Finished playing Asmaul Husna ${currentSequentialIndex + 1}`);
    if (isPlayingFullAudio.value) {
      currentSequentialIndex++;
      // Auto-play next with small delay
      setTimeout(() => playSequentialAudio(), 1);
    }
  };
  
  audioElement.onerror = async (e) => {
    console.error(`Audio error for Asmaul Husna ${currentSequentialIndex + 1}:`, e);
    if (isPlayingFullAudio.value) {
      // Show error notification
      const toast = await toastController.create({
        message: `Error audio: ${currentItem.transliteration}`,
        duration: 2000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
      
      // Try next item on error
      currentSequentialIndex++;
      setTimeout(() => playSequentialAudio(), 1000);
    }
  };
  
  audioElement.oncanplay = () => {
    console.log(`Successfully started playing Asmaul Husna ${currentSequentialIndex + 1}`);
  };
  
  // Try to play the audio
  try {
    await audioElement.play();
  } catch (error) {
    console.error(`Error playing audio for Asmaul Husna ${currentSequentialIndex + 1}:`, error);
    
    if (isPlayingFullAudio.value) {
      // Show error notification
      const toast = await toastController.create({
        message: `Gagal memutar audio: ${currentItem.transliteration}`,
        duration: 2000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
      
      // Try next item on error
      currentSequentialIndex++;
      setTimeout(() => playSequentialAudio(), 1000);
    }
  }
};

const playFullAudio = () => {
  if (asmaulHusnaList.value.length === 0) {
    console.warn('Asmaul Husna list is empty');
    
    toastController.create({
      message: 'Data Asmaul Husna belum tersedia',
      duration: 2000,
      position: 'bottom',
      color: 'warning'
    }).then(toast => toast.present());
    
    return;
  }

  // Since API doesn't provide full audio, always use sequential playback
  console.log('Playing Asmaul Husna sequentially (1-99)');
  
  // Show start notification
  toastController.create({
    message: 'Memulai pemutaran Asmaul Husna 1-99',
    duration: 2000,
    position: 'bottom',
    color: 'primary'
  }).then(toast => toast.present());
  
  // Ensure sequential playback starts from the beginning
  currentSequentialIndex = 0;
  playSequentialAudio();
};

const stopAudio = () => {
  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
    audioElement = null;
  }
  resetAudioState();
};

const resetAudioState = () => {
  isPlayingFullAudio.value = false;
  currentPlayingId.value = null;
};

const loadAsmaulHusnaData = async () => {
  try {
    const data = await AsmaulHusnaService.getAsmaulHusnaList(isOnline.value, locale.value as 'en' | 'id');
    asmaulHusnaList.value = data;
  } catch (error) {
    console.error('Error loading Asmaul Husna data:', error);
  }
};

onMounted(() => {
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    isOnline.value = navigator.onLine;
  } else {
    isOnline.value = true;
  }
  loadAsmaulHusnaData();
});

onUnmounted(() => {
  stopAudio();
});
</script>

<style scoped>
.content-wrapper {
  padding: 16px;
}

.hero-section {
  text-align: center;
  margin-bottom: 24px;
}

.hero-section h1 {
  font-size: 28px;
  font-weight: 800;
  margin: 0 0 8px 0;
}

.subtitle {
  color: var(--ion-color-medium);
  font-size: 14px;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.status-indicator {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

.controls-section {
  margin-bottom: 24px;
}

.audio-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.play-full-btn {
  --border-radius: 12px;
}

.stop-btn {
  --border-radius: 12px;
}

.search-filter {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-filter ion-input {
  --border-radius: 12px;
  --padding-start: 12px;
  --padding-end: 12px;
  border: 1px solid var(--ion-color-step-100, #f0f0f0);
}

.search-filter ion-segment {
  --border-radius: 12px;
}

.asmaul-husna-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.asmaul-husna-card {
  background: var(--ion-card-background, #fff);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid var(--ion-color-step-100, #f0f0f0);
  cursor: pointer;
  transition: all 0.3s ease;
}

.asmaul-husna-card:active {
  transform: scale(0.98);
  background: var(--ion-color-light);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.number {
  background: var(--ion-color-primary);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.arabic-text {
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 8px;
  color: var(--ion-color-primary);
  font-family: 'Traditional Arabic', 'Arial Unicode MS', serif;
}

.transliteration {
  font-size: 16px;
  text-align: center;
  margin-bottom: 8px;
  color: var(--ion-color-dark);
  font-weight: 600;
}

.translation {
  font-size: 14px;
  text-align: center;
  margin-bottom: 8px;
  color: var(--ion-color-medium);
  font-weight: 500;
}

.meaning {
  font-size: 12px;
  text-align: center;
  color: var(--ion-color-medium-shade);
  line-height: 1.4;
}

.modal-content {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.modal-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.modal-body .arabic-text.large {
  font-size: 32px;
  margin-bottom: 16px;
}

.modal-body .transliteration.large {
  font-size: 20px;
  margin-bottom: 16px;
}

.modal-body .translation.large {
  font-size: 16px;
  margin-bottom: 24px;
  font-weight: 600;
}

.modal-body .meaning {
  font-size: 14px;
  margin-bottom: 32px;
  line-height: 1.6;
}

.modal-actions {
  width: 100%;
}

.text-gradient {
  background: linear-gradient(135deg, var(--ion-color-primary), #14b8a6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Dark mode adjustments */
:host-context(body.dark) .asmaul-husna-card {
  background: var(--ion-card-background);
  border-color: var(--ion-color-step-150);
}

@media (min-width: 768px) {
  .asmaul-husna-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .asmaul-husna-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
