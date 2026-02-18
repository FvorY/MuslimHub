<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="transparent-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/worship" text=""></ion-back-button>
        </ion-buttons>
        <ion-title class="text-gradient">{{ $t('home.dzikir') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="dzikir-container ion-padding">
        
        <div class="section-label">{{ $t('worship.dzikir_daily') }}</div>
        
        <div class="dzikir-grid">
          <div class="dzikir-card premium-card morning" @click="router.push('/tabs/worship/tasbih/pagi')">
            <div class="icon-box glass-effect">
              <ion-icon :icon="sunny" />
            </div>
            <div class="dzikir-meta">
              <h3>{{ $t('worship.dzikir_morning') }}</h3>
              <p>{{ $t('worship.dzikir_morning_description') }}</p>
            </div>
            <div class="card-arrow"><ion-icon :icon="chevronForward" /></div>
          </div>

          <div class="dzikir-card premium-card evening" @click="router.push('/tabs/worship/tasbih/petang')">
            <div class="icon-box glass-effect">
              <ion-icon :icon="moon" />
            </div>
            <div class="dzikir-meta">
              <h3>{{ $t('worship.dzikir_evening') }}</h3>
              <p>{{ $t('worship.dzikir_evening_description') }}</p>
            </div>
            <div class="card-arrow"><ion-icon :icon="chevronForward" /></div>
          </div>

          <div class="dzikir-card premium-card prayer" @click="router.push('/tabs/worship/tasbih/shalat')">
            <div class="icon-box glass-effect">
              <ion-icon :icon="book" />
            </div>
            <div class="dzikir-meta">
              <h3>{{ $t('worship.dzikir_prayer') }}</h3>
              <p>{{ $t('worship.dzikir_prayer_description') }}</p>
            </div>
            <div class="card-arrow"><ion-icon :icon="chevronForward" /></div>
          </div>
        </div>

        <div class="section-label ion-margin-top">{{ $t('worship.others') }}</div>
        
        <div class="dzikir-card premium-card custom" @click="router.push('/tabs/worship/tasbih/custom')">
          <div class="icon-box glass-effect">
            <ion-icon :icon="fingerPrint" />
          </div>
          <div class="dzikir-meta">
            <h3>{{ $t('worship.tasbih_digital') }}</h3>
            <p>{{ $t('worship.tasbih_digital_description') }}</p>
          </div>
          <div class="card-arrow"><ion-icon :icon="chevronForward" /></div>
        </div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonIcon, useIonRouter } from '@ionic/vue';
import { sunny, moon, book, fingerPrint, chevronForward } from 'ionicons/icons';

const router = useIonRouter();
</script>

<style scoped>
.transparent-toolbar {
  --background: var(--ion-background-color);
  --padding-top: 10px;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--ion-color-medium);
  letter-spacing: 1.5px;
  margin: 12px 0 16px 4px;
}

.dzikir-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dzikir-card {
  display: flex;
  align-items: center;
  padding: 18px 20px;
  background: var(--ion-card-background);
  border: 1px solid var(--ion-border-color);
  cursor: pointer;
  position: relative;
}

.icon-box {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-right: 18px;
}

.morning .icon-box { background: #fffcf0; color: #f59e0b; }
.evening .icon-box { background: #f0f7ff; color: #2563eb; }
.prayer .icon-box { background: #ecfdf5; color: #059669; }
.custom .icon-box { background: #fdf2f8; color: #db2777; }

.dzikir-meta h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--ion-color-dark);
}

.dzikir-meta p {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  font-weight: 500;
}

.card-arrow {
  margin-left: auto;
  color: var(--ion-color-step-300);
  font-size: 1.2rem;
}

/* Animations */
@keyframes fadeInRight {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

.dzikir-card {
  animation: fadeInRight 0.4s ease-out both;
}

.dzikir-card:nth-child(1) { animation-delay: 0.1s; }
.dzikir-card:nth-child(2) { animation-delay: 0.2s; }
.dzikir-card:nth-child(3) { animation-delay: 0.3s; }
.custom { animation-delay: 0.4s; }
</style>
