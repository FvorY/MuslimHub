<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home" href="/tabs/home">
          <ion-icon aria-hidden="true" :icon="home" />
          <ion-label>{{ $t('tabs.home') }}</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="worship" href="/tabs/worship">
          <ion-icon aria-hidden="true" :icon="time" />
          <ion-label>{{ $t('tabs.worship') }}</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="quran" href="/tabs/quran">
          <ion-icon aria-hidden="true" :icon="book" />
          <ion-label>{{ $t('tabs.quran') }}</ion-label>
        </ion-tab-button>
        
        <ion-tab-button tab="tools" href="/tabs/tools">
          <ion-icon aria-hidden="true" :icon="grid" />
          <ion-label>{{ $t('tabs.tools') }}</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="settings" href="/tabs/settings">
          <ion-icon aria-hidden="true" :icon="settings" />
          <ion-label>{{ $t('tabs.settings') }}</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { home, time, book, grid, settings } from 'ionicons/icons';
</script>

<style scoped>
ion-tab-bar {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
</style>