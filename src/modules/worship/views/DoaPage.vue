<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="transparent-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/worship" text=""></ion-back-button>
        </ion-buttons>
        <ion-title>{{ t('worship.doa') }}</ion-title>
      </ion-toolbar>
    </ion-header>

     <ion-content :fullscreen="true">
      <div class="content-wrapper ion-padding">
        <section class="hero-section">
          <h1>{{ t('worship.doa_title') }}</h1>
          <p>{{ t('worship.doa_subtitle') }}</p>
        </section>

        <ion-searchbar v-model="searchQuery" :placeholder="t('worship.doa_search')" class="search-bar" />

        <div v-if="loading" class="state-block ion-text-center">
          <ion-spinner name="crescent" />
          <p>{{ t('worship.doa_loading') }}</p>
        </div>

        <div v-else-if="error" class="state-block ion-text-center">
          <ion-icon :icon="warningOutline" class="error-icon" />
          <p>{{ error }}</p>
          <ion-button size="small" @click="loadDoa">{{ t('common.retry') }}</ion-button>
        </div>

        <div v-else-if="!filteredDoaList.length" class="state-block ion-text-center">
          <ion-icon :icon="searchOutline" class="empty-icon" />
          <p>{{ t('worship.doa_empty') }}</p>
        </div>

        <ion-list v-else lines="none">
          <ion-card v-for="doa in filteredDoaList" :key="doa.id" class="doa-card">
            <ion-card-header>
              <div class="doa-header-top">
                <div class="title-wrap">
                  <ion-card-title>{{ doa.nama }}</ion-card-title>
                  <span class="doa-id">{{ t('worship.doa_number', { id: doa.id }) }}</span>
                </div>
                <ion-button
                  size="small"
                  color="primary"
                  class="audio-btn"
                  :disabled="!ttsReady || activeAudioDoaId === doa.id"
                  @click="playAudio(doa.id, doa.ar)"
                >
                  <ion-spinner v-if="activeAudioDoaId === doa.id" name="dots" />
                  <template v-else>
                    <ion-icon :icon="play" />
                    {{ t('common.listen') }}
                  </template>
                </ion-button>
              </div>
            </ion-card-header>

            <ion-card-content>
              <p class="arabic-text">{{ doa.ar }}</p>
              <p v-if="doa.tr" class="transliteration-text">{{ doa.tr }}</p>
              <p class="translation-text">{{ doa.idn }}</p>
            </ion-card-content>
          </ion-card>
        </ion-list>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonList,
          IonCard,
          IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonSpinner,
} from '@ionic/vue';
import { play, searchOutline, warningOutline } from 'ionicons/icons';
import { getAllDoa, Doa, DoaApiResponse } from '../services/doa-service';
import { isTtsSupported, speakText, stopTts } from '@/shared/services/tts';

const doaList = ref<Doa[]>([]);
const { t } = useI18n();
const searchQuery = ref('');
const loading = ref(true);
const error = ref('');
const ttsReady = ref(isTtsSupported());
const activeAudioDoaId = ref<string | null>(null);

const filteredDoaList = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) {
    return doaList.value;
  }

  return doaList.value.filter(
    (doa) =>
      doa.nama.toLowerCase().includes(query) ||
      doa.ar.toLowerCase().includes(query) ||
      doa.tr.toLowerCase().includes(query) ||
      doa.idn.toLowerCase().includes(query)
  );
});

const loadDoa = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response: DoaApiResponse = await getAllDoa();
    doaList.value = response.data;
  } catch (err) {
    console.error('Failed to load doa list:', err);
    error.value = t('common.error');
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await loadDoa();
});

const playAudio = async (doaId: string, text: string) => {
  if (!ttsReady.value) {
    return;
  }

  activeAudioDoaId.value = doaId;

  try {
    await stopTts();
    await speakText(text, 'ar-SA');
  } catch (err) {
    console.error('Error playing doa audio:', err);
  } finally {
    activeAudioDoaId.value = null;
  }
};

onBeforeUnmount(() => {
  void stopTts();
});
</script>

<style scoped>
.transparent-toolbar {
  --background: var(--ion-background-color);
  --padding-top: 10px;
}

.content-wrapper {
  min-height: 100%;
  padding-bottom: calc(28px + env(safe-area-inset-bottom));
}

.hero-section {
  background: linear-gradient(135deg, #0f766e, #0e7490);
  border-radius: 18px;
  padding: 16px;
  color: #fff;
  margin-bottom: 12px;
  box-shadow: 0 12px 24px rgba(14, 116, 144, 0.25);
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
  --background: var(--ion-card-background);
  --border-radius: 14px;
  --box-shadow: none;
  --placeholder-color: var(--ion-color-medium);
  margin-bottom: 8px;
}

.state-block {
  padding: 24px 12px;
  color: var(--ion-color-medium);
}

.error-icon,
.empty-icon {
  font-size: 30px;
  margin-bottom: 8px;
}

.error-icon {
  color: var(--ion-color-danger);
}

.doa-card {
  margin: 18px 0;
  border: 1px solid var(--ion-border-color);
  border-radius: 20px;
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.doa-header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.title-wrap {
  display: grid;
  gap: 4px;
  min-width: 0;
  flex: 1 1 220px;
}

.title-wrap ion-card-title {
  font-size: 1.05rem;
  margin: 0;
  font-weight: 800;
}

.doa-id {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
  font-weight: 600;
}

.audio-btn {
  --border-radius: 10px;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 2px;
}

.arabic-text {
  font-family: var(--arabic-font), 'Traditional Arabic', 'Arial Unicode MS', serif;
  font-size: clamp(1.65rem, 5.2vw, 2.05rem);
  text-align: right;
  direction: rtl;
  unicode-bidi: plaintext;
  line-height: 2;
  margin: 8px 0 18px;
  color: var(--ion-text-color);
  font-weight: 700;
  letter-spacing: 0;
  opacity: 1;
}

.transliteration-text {
  font-style: italic;
  color: var(--ion-color-medium);
  margin: 0 0 14px;
  line-height: 1.6;
  font-size: 1.03rem;
}

.translation-text {
  font-size: 1.02rem;
  line-height: 1.75;
  margin: 0;
}

:deep(.doa-card ion-card-header) {
  padding: 16px 16px 10px;
}

:deep(.doa-card ion-card-content) {
  padding: 4px 16px 18px;
}

@media (max-width: 420px) {
  .audio-btn {
    width: 100%;
  }
}
</style>
