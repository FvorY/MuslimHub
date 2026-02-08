<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
            <ion-back-button default-href="/tabs/worship"></ion-back-button>
        </ion-buttons>
        <ion-title>Doa</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-searchbar
        placeholder="Cari Doa"
        v-model="searchQuery"
      ></ion-searchbar>
      <ion-list v-if="filteredDoaList.length > 0">
              <ion-card v-for="doa in filteredDoaList" :key="doa.id">
                <ion-card-header class="doa-card-header">
                  <div class="doa-header-content-wrapper">
                    <ion-card-title>{{ doa.nama }}</ion-card-title>
                    <ion-button @click="playAudio(doa.ar)" color="primary" size="small">
                      <ion-icon :icon="play"></ion-icon>
                      Dengarkan
                    </ion-button>
                  </div>
                </ion-card-header>
                <ion-card-content>
                  <p class="arabic-text">{{ doa.ar }}</p>
                  <p class="transliteration-text">{{ doa.tr }}</p>
                  <p class="translation-text">{{ doa.idn }}</p>
                </ion-card-content>
              </ion-card>
            </ion-list>
      <div v-else class="ion-padding">
        <p>Tidak ada doa yang tersedia.</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
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
        } from '@ionic/vue';
        import { play } from 'ionicons/icons';
        import { getAllDoa, Doa, DoaApiResponse } from '../services/doa-service';
        
        declare const puter: any; // Deklarasi global untuk Puter.js
        
        const doaList = ref<Doa[]>([]);
        const searchQuery = ref('');
        
        const filteredDoaList = computed(() => {
          if (!searchQuery.value) {
            return doaList.value;
          }
          const query = searchQuery.value.toLowerCase();
          return doaList.value.filter(doa =>
            doa.nama.toLowerCase().includes(query) ||
            doa.ar.toLowerCase().includes(query) ||
            doa.tr.toLowerCase().includes(query) ||
            doa.idn.toLowerCase().includes(query)
          );
        });
        
        onMounted(async () => {
          try {
            const response: DoaApiResponse = await getAllDoa();
            doaList.value = response.data;
            console.log('Doa list loaded:', doaList.value);
          } catch (error) {
            console.error('Failed to load doa list:', error);
          }
        });
        
        let currentAudio: HTMLAudioElement | null = null; // Variabel untuk menyimpan audio yang sedang diputar
        
        const playAudio = async (text: string) => {
          try {
            // Hentikan audio yang sedang diputar jika ada
            if (currentAudio) {
              currentAudio.pause();
              currentAudio.currentTime = 0;
            }
        
            if (typeof puter !== 'undefined' && puter.ai && puter.ai.txt2speech) {
              const audio = await puter.ai.txt2speech(text, 'ar-SA'); // Menggunakan bahasa Arab
              currentAudio = audio;
              if (currentAudio) { // Memastikan currentAudio tidak null sebelum memanggil play()
                currentAudio.play();
              }
            } else {
              console.error('Puter.js not loaded or txt2speech not available.');
            }
          } catch (error) {
            console.error('Error playing audio:', error);
          }
        };
        </script>
        
        <style scoped>
        ion-card {
          margin-bottom: 16px;
        }
        
        ion-card-title {
          font-size: 1.4em;
          font-weight: bold;
        }
        
        .arabic-text {
          font-family: 'Amiri', serif; /* Contoh font Arab, Anda mungkin perlu mengimpornya */
          font-size: 1.8em;
          text-align: right;
          line-height: 2.5;
          margin-bottom: 10px;
        }
        
        .transliteration-text {
          font-style: italic;
          color: #888;
          margin-bottom: 5px;
        }
        
        .translation-text {
          font-size: 1.1em;
          line-height: 1.6;
        }
        
        ion-button {
          /* margin-top: 10px; */ /* Dihapus karena flexbox akan menangani penempatan */
        }
        
        .doa-card-header {
          padding: 16px; /* Menambahkan padding untuk memastikan jarak yang baik */
        }
        
        .doa-header-content-wrapper {
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }
        
        ion-card-title {
          margin: 0; /* Reset all margins */
          margin-right: 10px; /* Add desired right margin */
        }
        </style>
