<template>
  <ion-page>
    <ion-header class="ion-no-border translucent-header">
      <ion-toolbar class="transparent-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/worship/dzikir" text="" class="back-btn"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ title }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click.stop="resetCount" class="icon-btn">
            <ion-icon :icon="refresh" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="tasbih-content" @click="increment">
      <div class="tasbih-immersive-container">
        <!-- Background Decorations -->
        <div class="bg-orb orb-1"></div>
        <div class="bg-orb orb-2"></div>
        
        <div class="counter-focused-area">
          <div class="progress-container">
            <!-- SVG Progress Ring -->
            <svg class="progress-ring" viewBox="0 0 100 100">
              <circle class="progress-ring-track" cx="50" cy="50" r="45" fill="transparent" stroke-width="2" />
              <circle class="progress-ring-fill" 
                      cx="50" cy="50" r="45" 
                      fill="transparent" 
                      stroke-width="3" 
                      stroke-linecap="round"
                      :style="{ 
                        strokeDasharray: '283', 
                        strokeDashoffset: (283 - (283 * progress) / 100).toString() 
                      }" 
              />
            </svg>
            
            <div class="counter-display" :class="{ pulsing: isTapping }">
              <div class="target-tag glass-effect" v-if="target > 0">
                Target: {{ target }}
              </div>
              <span class="count-number">{{ count }}</span>
              <div class="session-total">Total Sesi: {{ count }}</div>
            </div>
          </div>
        </div>

        <div class="tap-instruction-area">
          <div class="tap-hint glass-effect">
            <ion-icon :icon="fingerPrint" />
            <span>Sentuh di mana saja untuk menghitung</span>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonButton, IonIcon, IonContent } from '@ionic/vue';
import { refresh, fingerPrint } from 'ionicons/icons';
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const route = useRoute();
const count = ref(0);
const target = ref(33);
const title = ref('Tasbih');
const isTapping = ref(false);

const progress = computed(() => {
  if (target.value === 0) return 0;
  return Math.min((count.value / target.value) * 100, 100);
});

onMounted(() => {
  const type = route.params.type as string;
  updateMetadata(type);
});

watch(() => route.params.type, (newType) => {
  updateMetadata(newType as string);
});

const updateMetadata = (type: string) => {
  if (type === 'pagi') {
    title.value = 'Dzikir Pagi';
    target.value = 100; 
  } else if (type === 'petang') {
    title.value = 'Dzikir Petang';
    target.value = 100;
  } else if (type === 'shalat') {
    title.value = 'Dzikir Shalat';
    target.value = 33;
  } else {
    title.value = 'Tasbih Digital';
    target.value = 99;
  }
};

const increment = async () => {
  count.value++;
  isTapping.value = true;
  setTimeout(() => isTapping.value = false, 100);
  
  // Haptic Feedback
  try {
    if (target.value > 0 && count.value % target.value === 0) {
        await Haptics.vibrate({ duration: 500 });
        await Haptics.notification({ type: 'success' as any });
    } else {
        await Haptics.impact({ style: ImpactStyle.Medium });
    }
  } catch (e) {
    // Ignore haptic errors
  }
};

const resetCount = async () => {
    count.value = 0;
    try {
      await Haptics.notification({ type: 'warning' as any });
    } catch (e) {}
};
</script>

<style scoped>
.translucent-header {
  background: transparent;
  position: absolute;
  top: 0;
  width: 100%;
}

.transparent-toolbar {
  --background: transparent;
  --color: white;
  --border-width: 0;
  --padding-top: 10px;
}

.transparent-toolbar ion-title {
  color: white;
  font-weight: 800;
}

.back-btn {
  --color: white;
}

.icon-btn {
  --color: white;
}

.tasbih-immersive-container {
  height: 100%;
  background: linear-gradient(135deg, #065f46 0%, #064e3b 100%);
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
  opacity: 0.4;
}

.orb-1 {
  width: 300px;
  height: 300px;
  background: var(--ion-color-primary);
  top: -100px;
  left: -100px;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: var(--ion-color-secondary);
  bottom: -150px;
  right: -150px;
}

.counter-focused-area {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
}

.progress-container {
  position: relative;
  width: 300px;
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.progress-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-ring-track {
  stroke: rgba(255, 255, 255, 0.1);
}

.progress-ring-fill {
  stroke: var(--ion-color-primary-tint);
  transition: stroke-dashoffset 0.3s ease;
  filter: drop-shadow(0 0 5px var(--ion-color-primary));
}

.counter-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.counter-display.pulsing {
  transform: scale(1.1);
}

.count-number {
  font-size: 8rem;
  font-weight: 800;
  color: white;
  line-height: 1;
  letter-spacing: -4px;
}

.target-tag {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 800;
  color: white;
  margin-bottom: 20px;
  letter-spacing: 1px;
}

.session-total {
  margin-top: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
}

.tap-instruction-area {
  padding: 40px;
  display: flex;
  justify-content: center;
  z-index: 2;
}

.tap-hint {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  border-radius: 30px;
  color: white;
  font-size: 0.85rem;
  font-weight: 600;
  animation: breathe 3s infinite ease-in-out;
}

.tap-hint ion-icon {
  font-size: 1.2rem;
  opacity: 0.8;
}

@keyframes breathe {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
}

</style>
