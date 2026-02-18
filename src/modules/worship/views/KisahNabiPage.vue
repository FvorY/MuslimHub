<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/worship"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ t('worship.kisah_nabi') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="content-wrapper">
        <section class="hero-section">
          <h1>{{ t('worship.kisah_nabi') }}</h1>
          <p>{{ t('worship.kisah_nabi_description') }}</p>
        </section>

        <ion-searchbar
          v-model="searchQuery"
          :placeholder="t('worship.search_kisah_nabi')"
          class="search-bar"
        />

        <div v-if="loading" class="state-block ion-text-center">
          <ion-spinner name="crescent" />
          <p>{{ t('worship.loading_kisah_nabi') }}</p>
        </div>

        <div v-else-if="error" class="state-block ion-text-center">
          <ion-icon :icon="warningOutline" class="error-icon" />
          <p>{{ error }}</p>
          <ion-button size="small" @click="loadKisahNabi">
            {{ t('worship.retry') }}
          </ion-button>
        </div>

        <div v-else-if="!filteredStories.length" class="state-block ion-text-center">
          <p>{{ t('worship.empty_kisah_nabi') }}</p>
        </div>

        <ion-list v-else lines="none">
          <ion-card v-for="story in filteredStories" :key="story.id" class="story-card">
            <ion-card-header>
              <div class="story-header-top">
                <div class="title-wrap">
                  <ion-card-title>{{ story.title }}</ion-card-title>
                  <ion-card-subtitle v-if="story.prophetName !== story.title">{{ story.prophetName }}</ion-card-subtitle>
                </div>
                <ion-button
                  size="small"
                  color="primary"
                  class="audio-btn"
                  :disabled="!ttsReady || audioLoadingId === story.id"
                  @click="toggleStoryAudio(story)"
                >
                  <ion-spinner v-if="audioLoadingId === story.id" name="dots" />
                  <template v-else-if="playingStoryId === story.id">
                    <ion-icon :icon="stop" />
                    {{ t('common.stop') }}
                  </template>
                  <template v-else>
                    <ion-icon :icon="play" />
                    {{ t('tools.play_audio') }}
                  </template>
                </ion-button>
              </div>
            </ion-card-header>

            <ion-card-content>
              <img
                v-if="story.imageUrl && !failedImageMap[story.id]"
                :src="story.imageUrl"
                :alt="story.prophetName"
                class="story-image"
                loading="lazy"
                @error="markImageFailed(story.id)"
              />

              <div class="meta-grid">
                <div class="meta-item">
                  <span class="meta-label">{{ t('worship.prophet_name') }}</span>
                  <strong>{{ story.prophetName || '-' }}</strong>
                </div>
                <div class="meta-item">
                  <span class="meta-label">{{ t('worship.birth_year') }}</span>
                  <strong>{{ story.birthYear || '-' }}</strong>
                </div>
                <div class="meta-item">
                  <span class="meta-label">{{ t('worship.age') }}</span>
                  <strong>{{ story.age || '-' }}</strong>
                </div>
                <div class="meta-item">
                  <span class="meta-label">{{ t('worship.birthplace') }}</span>
                  <strong>{{ story.place || '-' }}</strong>
                </div>
              </div>

              <p class="story-text" :class="{ collapsed: expandedId !== story.id }">
                {{ story.content }}
              </p>
              <ion-button
                v-if="isLongStory(story.content)"
                fill="clear"
                size="small"
                class="toggle-btn"
                @click="toggleExpanded(story.id)"
              >
                {{ expandedId === story.id ? t('worship.show_less') : t('worship.read_more') }}
              </ion-button>
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
  IonCardSubtitle,
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
import { getAllKisahNabi, type KisahNabiItem } from '../services/kisah-nabi-service';
import { isTtsSupported, speakText, stopTts } from '@/shared/services/tts';

const { t, locale } = useI18n();

const stories = ref<KisahNabiItem[]>([]);
const searchQuery = ref('');
const loading = ref(false);
const error = ref('');
const expandedId = ref<string | null>(null);
const failedImageMap = ref<Record<string, boolean>>({});
const ttsReady = ref(isTtsSupported());
const audioLoadingId = ref<string | null>(null);
const playingStoryId = ref<string | null>(null);

const isLongStory = (content: string): boolean => content.length > 280;

const toggleExpanded = (id: string) => {
  expandedId.value = expandedId.value === id ? null : id;
};

const markImageFailed = (id: string) => {
  if (failedImageMap.value[id]) return;
  failedImageMap.value = {
    ...failedImageMap.value,
    [id]: true
  };
};

const stopActiveAudio = () => {
  void stopTts();
  playingStoryId.value = null;
};

const toggleStoryAudio = async (story: KisahNabiItem) => {
  if (!ttsReady.value) return;

  if (playingStoryId.value === story.id) {
    stopActiveAudio();
    return;
  }

  audioLoadingId.value = story.id;

  try {
    stopActiveAudio();
    const text = `${story.title}. ${story.content}`;
    playingStoryId.value = story.id;
    await speakText(text, locale.value === 'en' ? 'en-US' : 'id-ID');
    if (playingStoryId.value === story.id) {
      playingStoryId.value = null;
    }
  } catch (err) {
    console.error('Failed to play kisah nabi audio:', err);
    playingStoryId.value = null;
  } finally {
    audioLoadingId.value = null;
  }
};

const filteredStories = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return stories.value;

  return stories.value.filter((story) => {
    return story.prophetName.toLowerCase().includes(query) || story.title.toLowerCase().includes(query);
  });
});

const loadKisahNabi = async () => {
  loading.value = true;
  error.value = '';

  try {
    stories.value = await getAllKisahNabi();
  } catch (err) {
    console.error('Failed to load kisah nabi:', err);
    error.value = t('common.error');
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await loadKisahNabi();
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

.story-card {
  margin: 0 0 14px 0;
  border: 1px solid var(--ion-color-step-100, #e7e7e7);
  border-radius: 18px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.story-card :deep(ion-card-header) {
  padding: 14px 14px 8px;
}

.story-card :deep(ion-card-content) {
  padding: 8px 14px 14px;
}

.story-card :deep(ion-card-title) {
  margin: 0;
  font-size: 22px;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.story-card :deep(ion-card-subtitle) {
  margin-top: 4px;
}

.story-header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.title-wrap {
  flex: 1;
  min-width: 180px;
}

.audio-btn {
  --border-radius: 10px;
  white-space: nowrap;
  min-width: 132px;
}

.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}

.meta-item {
  background: var(--ion-color-light, #f5f7fa);
  border-radius: 12px;
  padding: 10px;
}

.meta-label {
  display: block;
  font-size: 11px;
  color: var(--ion-color-medium);
  margin-bottom: 2px;
}

.story-text {
  margin: 0;
  line-height: 1.65;
  color: var(--ion-color-dark);
  white-space: pre-line;
}

.story-image {
  width: 100%;
  border-radius: 14px;
  margin-bottom: 12px;
  border: 1px solid var(--ion-color-step-150, #d9d9d9);
  object-fit: cover;
}

.story-text.collapsed {
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.toggle-btn {
  margin-top: 8px;
  --padding-start: 0;
}

@media (max-width: 420px) {
  .audio-btn {
    width: 100%;
  }

  .meta-grid {
    grid-template-columns: 1fr;
  }
}
</style>
