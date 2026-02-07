<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/worship"></ion-back-button>
        </ion-buttons>
        <ion-title>Qibla Finder</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <div class="redirect-container">
        <ion-text color="medium">
          <p>Mengarahkan ke Qibla Finder...</p>
        </ion-text>
        <ion-spinner name="crescent"></ion-spinner>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonText, IonSpinner } from '@ionic/vue';

onMounted(() => {
  window.location.href = 'https://qiblafinder.withgoogle.com/intl/en/finder/ar';
});
</script>

<style scoped>
.redirect-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
}
</style>