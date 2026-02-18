<template>
  <ion-page>
    <!-- <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title class="page-title">{{ $t('tabs.tools') }}</ion-title>
      </ion-toolbar>
    </ion-header> -->

    <ion-content :fullscreen="true">
      <br>
      <div class="content-wrapper">
        <header class="hero-section">
          <h1 class="text-gradient">{{ $t('tabs.tools') }}</h1>
          <p class="subtitle">{{ $t('tools.subtitle') }}</p>
        </header>

        <section class="menu-grid">
          <div class="menu-card premium-card" @click="router.push('/tabs/tools/zakat')">
            <div class="icon-wrapper gradient-zakat">
              <ion-icon :icon="calculator"></ion-icon>
            </div>
            <div class="card-content">
              <h3>{{ $t('tools.zakat_calculator') }}</h3>
              <p>{{ $t('tools.zakat_description') }}</p>
            </div>
            <ion-icon :icon="chevronForward" class="arrow-icon"></ion-icon>
          </div>

          <div class="menu-card premium-card" @click="router.push('/tabs/tools/ramadan')">
            <div class="icon-wrapper gradient-ramadan">
              <ion-icon :icon="moon"></ion-icon>
            </div>
            <div class="card-content">
              <h3>{{ $t('tools.ramadan_companion') }}</h3>
              <p>{{ $t('tools.ramadan_description') }}</p>
            </div>
            <ion-icon :icon="chevronForward" class="arrow-icon"></ion-icon>
          </div>

          <div class="menu-card premium-card" @click="router.push('/tabs/tools/asmaul-husna')">
            <div class="icon-wrapper gradient-asmaul-husna">
              <ion-icon :icon="star"></ion-icon>
            </div>
            <div class="card-content">
              <h3>{{ $t('tools.asmaul_husna') }}</h3>
              <p>{{ $t('tools.asmaul_husna_description') }}</p>
            </div>
            <ion-icon :icon="chevronForward" class="arrow-icon"></ion-icon>
          </div>

          <div class="menu-card premium-card" @click="router.push('/tabs/tools/imsyak')">
            <div class="icon-wrapper gradient-imsyak">
              <ion-icon :icon="time"></ion-icon>
            </div>
            <div class="card-content">
              <h3>{{ $t('tools.imsyak_schedule') }}</h3>
              <p>{{ $t('tools.imsyak_description') }}</p>
            </div>
            <ion-icon :icon="chevronForward" class="arrow-icon"></ion-icon>
          </div>
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent, IonIcon } from '@ionic/vue';
import { calculator, moon, star, chevronForward, time } from 'ionicons/icons';
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
  line-height: 1.5;
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
  border-radius: 20px;
  border: 1px solid var(--ion-color-step-100, #f0f0f0);
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.menu-card:active {
  transform: scale(0.98);
  background: var(--ion-color-light);
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

.gradient-zakat {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
}

.gradient-ramadan {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.gradient-asmaul-husna {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.gradient-imsyak {
  background: linear-gradient(135deg, #06b6d4, #0891b2);
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
:host-context(body.dark) .menu-card {
  background: var(--ion-card-background);
  border-color: var(--ion-color-step-150);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.text-gradient {
  background: linear-gradient(135deg, var(--ion-color-primary), #14b8a6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>
