<template>
  <ion-page>
    <!-- <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title class="page-title">{{ $t('tabs.worship') }}</ion-title>
      </ion-toolbar>
    </ion-header> -->

    <ion-content :fullscreen="true">
      <br>
      <div class="content-wrapper">
        <header class="hero-section">
          <h1 class="text-gradient">{{ $t('tabs.worship') }}</h1>
          <p class="subtitle">Lengkapi ibadah harianmu dengan fitur pilihan</p>
        </header>

        <section class="menu-grid">
          <div class="menu-card premium-card" @click="router.push('/tabs/worship/prayer-times')">
            <div class="icon-wrapper gradient-1">
              <ion-icon :icon="time"></ion-icon>
            </div>
            <div class="card-content">
              <h3>{{ $t('home.prayer_times') }}</h3>
              <p>Jadwal sholat akurat sesuai lokasi</p>
            </div>
            <ion-icon :icon="chevronForward" class="arrow-icon"></ion-icon>
          </div>

          <div class="menu-card premium-card" @click="router.push('/tabs/worship/dzikir')">
            <div class="icon-wrapper gradient-2">
              <ion-icon :icon="fingerPrint"></ion-icon>
            </div>
            <div class="card-content">
              <h3>{{ $t('home.dzikir') }}</h3>
              <p>Tasbih digital dan kumpulan dzikir</p>
            </div>
            <ion-icon :icon="chevronForward" class="arrow-icon"></ion-icon>
          </div>

          <div class="menu-card premium-card" @click="router.push('/tabs/worship/qibla')">
            <div class="icon-wrapper gradient-3">
              <ion-icon :icon="compass"></ion-icon>
            </div>
            <div class="card-content">
              <h3>{{ $t('home.qibla') }}</h3>
              <p>Temukan arah kiblat dengan mudah</p>
            </div>
            <ion-icon :icon="chevronForward" class="arrow-icon"></ion-icon>
          </div>
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon } from '@ionic/vue';
import { time, fingerPrint, compass, chevronForward } from 'ionicons/icons';
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<style scoped>
.content-wrapper {
  padding: 24px;
}

.hero-section {
  margin-bottom: 32px;
}

.page-title {
  font-weight: 700;
}

.hero-section h1 {
  font-size: 32px;
  font-weight: 800;
  margin: 0 0 8px 0;
}

.hero-section .subtitle {
  color: var(--ion-color-medium);
  font-size: 15px;
  margin: 0;
}

.menu-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.menu-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: var(--ion-background-color, #fff);
  border: 1px solid var(--ion-color-step-100, #f0f0f0);
  cursor: pointer;
  position: relative;
}

.icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: white;
  flex-shrink: 0;
}

.icon-wrapper ion-icon {
  font-size: 28px;
}

.gradient-1 {
  background: linear-gradient(135deg, #10b981, #059669);
}

.gradient-2 {
  background: linear-gradient(135deg, #14b8a6, #0d9488);
}

.gradient-3 {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.card-content {
  flex: 1;
}

.card-content h3 {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: var(--ion-text-color);
}

.card-content p {
  font-size: 13px;
  color: var(--ion-color-medium);
  margin: 0;
}

.arrow-icon {
  color: var(--ion-color-step-300);
  font-size: 20px;
}

/* Dark mode adjustments */
body.dark .menu-card {
  background: var(--ion-card-background);
  border-color: var(--ion-color-step-150);
}
</style>

