<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/worship"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ t('worship.tahlil') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="content-wrapper">
        <section class="hero-section">
          <h1>{{ t('worship.tahlil') }}</h1>
          <p>{{ t('worship.tahlil_subtitle') }}</p>
        </section>

        <ion-searchbar v-model="searchQuery" :placeholder="t('worship.tahlil_search')" class="search-bar" />

        <div v-if="loading" class="state-block ion-text-center">
          <ion-spinner name="crescent" />
          <p>{{ t('worship.tahlil_loading') }}</p>
        </div>

        <div v-else-if="error" class="state-block ion-text-center">
          <ion-icon :icon="warningOutline" class="error-icon" />
          <p>{{ error }}</p>
          <ion-button size="small" @click="loadTahlil">{{ t('common.retry') }}</ion-button>
        </div>

        <div v-else-if="!filteredItems.length" class="state-block ion-text-center">
          <p>{{ t('worship.tahlil_empty') }}</p>
        </div>

        <ion-list v-else lines="none">
          <ion-card v-for="item in filteredItems" :key="item.id" class="tahlil-card">
            <ion-card-header>
              <div class="card-header-top">
                <div class="title-wrap">
                  <span class="number-chip">{{ item.number }}</span>
                  <ion-card-title>{{ item.title }}</ion-card-title>
                </div>
                <ion-button
                  size="small"
                  color="primary"
                  class="audio-btn"
                  :disabled="!ttsReady || audioLoadingId === item.id"
                  @click="toggleAudio(item)"
                >
                  <ion-spinner v-if="audioLoadingId === item.id" name="dots" />
                  <template v-else-if="playingItemId === item.id">
                    <ion-icon :icon="stop" />
                    Stop
                  </template>
                  <template v-else>
                    <ion-icon :icon="play" />
                    {{ t('tools.play_audio') }}
                  </template>
                </ion-button>
              </div>
            </ion-card-header>

            <ion-card-content>
              <p v-if="item.arabic" class="arabic-text">{{ item.arabic }}</p>
              <p v-if="item.translation" class="translation-text">{{ item.translation }}</p>
            </ion-card-content>
          </ion-card>
        </ion-list>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonList,
  IonPage,
  IonSearchbar,
  IonSpinner,
  IonTitle,
  IonToolbar
} from '@ionic/vue';
import { play, stop, warningOutline } from 'ionicons/icons';
import { getAllTahlil, type TahlilItem } from '../services/tahlil-service';
import { isTtsSupported, speakText, stopTts } from '@/shared/services/tts';

const items = ref<TahlilItem[]>([]);
const { t } = useI18n();
const searchQuery = ref('');
const loading = ref(false);
const error = ref('');
const ttsReady = ref(isTtsSupported());
const audioLoadingId = ref<string | null>(null);
const playingItemId = ref<string | null>(null);

const stopActiveAudio = () => {
  void stopTts();
  playingItemId.value = null;
};

const toggleAudio = async (item: TahlilItem) => {
  if (!ttsReady.value || !item.arabic) return;

  if (playingItemId.value === item.id) {
    stopActiveAudio();
    return;
  }

  audioLoadingId.value = item.id;

  try {
    stopActiveAudio();
    playingItemId.value = item.id;
    await speakText(item.arabic, 'ar-SA');
    if (playingItemId.value === item.id) {
      playingItemId.value = null;
    }
  } catch (err) {
    console.error('Failed to play tahlil audio:', err);
    playingItemId.value = null;
  } finally {
    audioLoadingId.value = null;
  }
};

const filteredItems = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return items.value;

  return items.value.filter((item) => {
    return (
      item.title.toLowerCase().includes(query) ||
      item.arabic.toLowerCase().includes(query) ||
      item.translation.toLowerCase().includes(query)
    );
  });
});

const loadTahlil = async () => {
  loading.value = true;
  error.value = '';

  try {
    items.value = await getAllTahlil();
  } catch (err) {
    console.error('Failed to load tahlil:', err);
    error.value = t('common.error');
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await loadTahlil();
});

onBeforeUnmount(() => {
  stopActiveAudio();
});
</script>

<style scoped>
.content-wrapper {
  padding: 16px;
}

.hero-section {
  background: linear-gradient(135deg, #b45309, #d97706);
  border-radius: 18px;
  padding: 16px;
  color: #fff;
  margin-bottom: 12px;
  box-shadow: 0 12px 24px rgba(180, 83, 9, 0.28);
}

.hero-section h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
}

.hero-section p {
  margin: 6px 0 0;
  opacity: 0.95;
  line-height: 1.45;
  font-size: 13px;
}

.search-bar {
  margin-bottom: 12px;
}

.state-block {
  padding: 24px 12px;
  color: var(--ion-color-medium);
}

.error-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.tahlil-card {
  margin: 0 0 14px 0;
  border: 1px solid var(--ion-color-step-100, #e7e7e7);
  border-radius: 18px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
}

.tahlil-card :deep(ion-card-header) {
  padding: 14px 14px 8px;
}

.tahlil-card :deep(ion-card-content) {
  padding: 8px 14px 14px;
}

.card-header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 180px;
  flex: 1;
}

.number-chip {
  min-width: 28px;
  height: 28px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fef3c7;
  color: #92400e;
  font-size: 12px;
  font-weight: 700;
}

.tahlil-card :deep(ion-card-title) {
  margin: 0;
  font-size: 19px;
  line-height: 1.25;
}

.audio-btn {
  --border-radius: 10px;
  white-space: nowrap;
  min-width: 100px;
}

.arabic-text {
  margin: 0 0 10px;
  font-family: var(--arabic-font);
  font-size: 1.8em;
  text-align: right;
  line-height: 2;
}

.translation-text {
  margin: 0;
  line-height: 1.6;
  color: var(--ion-color-dark);
}

@media (max-width: 420px) {
  .audio-btn {
    width: 100%;
  }
}
</style>
