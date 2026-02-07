<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="header-toolbar">
        <center> <ion-title class="text-gradient">{{ $t('tabs.quran') }}</ion-title> </center>
      </ion-toolbar>
      <ion-toolbar class="search-toolbar">
        <div class="search-container ion-padding-horizontal">
          <ion-searchbar 
            :placeholder="searchPlaceholder" 
            v-model="searchQuery" 
            :debounce="300"
            class="custom-search"
          ></ion-searchbar>
        </div>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="loading-state" v-if="loading">
        <ion-spinner color="primary"></ion-spinner>
      </div>

      <div class="surah-list-container" v-else>
        <div 
          v-for="surah in filteredSurahs" 
          :key="surah.nomor" 
          class="surah-card premium-card"
          @click="router.push(`/tabs/quran/surah/${surah.nomor}`)"
        >
          <div class="surah-info-left">
            <div class="surah-number-badge glass-effect">{{ surah.nomor }}</div>
            <div class="surah-meta">
              <h3>{{ surah.namaLatin }}</h3>
              <p>{{ surah.arti }} • {{ surah.jumlahAyat }} Ayat</p>
            </div>
          </div>
          <div class="surah-info-right">
            <div class="arabic-name">{{ surah.nama }}</div>
          </div>
        </div>
      </div>
      
      <div v-if="!loading && filteredSurahs.length === 0" class="empty-state ion-padding ion-text-center">
        <ion-icon :icon="book" class="empty-icon" />
        <p>Tidak ada surah yang ditemukan.</p>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar, IonRefresher, IonRefresherContent, IonSpinner, IonIcon, useIonRouter } from '@ionic/vue';
import { book } from 'ionicons/icons';
import { ref, computed, onMounted } from 'vue';
import { QuranService, Surah } from '@/modules/quran/services/quran-api';
import { useI18n } from 'vue-i18n';

const router = useIonRouter();
const { t } = useI18n(); 

const surahs = ref<Surah[]>([]);
const searchQuery = ref('');
const loading = ref(true);
const searchPlaceholder = 'Cari Surah...'; 

const filteredSurahs = computed(() => {
  if (!searchQuery.value) return surahs.value;
  const q = searchQuery.value.toLowerCase();
  return surahs.value.filter(s => 
    s.namaLatin.toLowerCase().includes(q) || 
    s.arti.toLowerCase().includes(q)
  );
});

const loadData = async (forceRefreh = false) => {
  loading.value = true;
  surahs.value = await QuranService.getSurahList(forceRefreh);
  loading.value = false;
};

const handleRefresh = async (event: CustomEvent) => {
  await loadData(true);
  event.detail.complete();
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.header-toolbar {
  --background: var(--ion-background-color, #ffffff);
  --padding-top: 10px;
}

.search-toolbar {
  --background: var(--ion-background-color, #ffffff);
  --border-style: none;
  --padding-bottom: 12px;
}

.custom-search {
  --border-radius: 16px;
  --box-shadow: none;
  --background: var(--ion-color-light);
  padding: 0;
}

.surah-list-container {
  padding: 0 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.surah-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--ion-card-background);
  border: 1px solid var(--ion-border-color);
  cursor: pointer;
}

.surah-info-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.surah-number-badge {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.9rem;
  color: var(--ion-color-primary);
  border: 1px solid rgba(var(--ion-color-primary-rgb), 0.2);
}

.surah-meta h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ion-color-dark);
}

.surah-meta p {
  margin: 4px 0 0;
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  font-weight: 500;
}

.arabic-name {
  font-family: var(--arabic-font);
  font-size: 1.8rem;
  color: var(--ion-color-primary);
  font-weight: 400;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.empty-state {
  padding-top: 60px;
  color: var(--ion-color-medium);
}
.empty-icon {
  font-size: 4rem;
  opacity: 0.2;
  margin-bottom: 16px;
}

/* Animations */
@keyframes slideInUp {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

.surah-card {
  will-change: transform;
  transform: translateZ(0);
}

/* Add stagger effect manually for performance */
.surah-card:nth-child(n) { animation-delay: calc(0.05s * var(--n, 0)); }
</style>
