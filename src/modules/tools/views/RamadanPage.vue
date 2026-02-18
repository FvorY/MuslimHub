<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/tools"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ t('tools.ramadan_companion') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
       <div class="ramadan-hero ion-padding ion-text-center">
         <h1>🌙 {{ t('tools.ramadan_kareem') }}</h1>
         <div class="countdown-box">
           <h2>{{ daysLeft }}</h2>
           <p>{{ t('tools.days_left') }}</p>
         </div>
         <div class="progress-ring">
           <div class="progress-circle" :style="{ background: `conic-gradient(var(--ion-color-primary) 0deg, var(--ion-color-primary) ${progressAngle}deg, var(--ion-color-light) ${progressAngle}deg, var(--ion-color-light) 360deg)` }">
             <div class="progress-inner">
               <span class="progress-text">{{ completedTasks }}/{{ totalTasks }}</span>
               <span class="progress-label">{{ t('tools.completed') }}</span>
             </div>
           </div>
         </div>
       </div>

       <div class="stats-section ion-padding">
         <div class="stats-grid">
           <div class="stat-card">
             <div class="stat-number">{{ streakDays }}</div>
             <div class="stat-label">{{ t('tools.day_streak') }}</div>
           </div>
           <div class="stat-card">
             <div class="stat-number">{{ totalCompleted }}</div>
             <div class="stat-label">{{ t('tools.total_tasks') }}</div>
           </div>
         </div>
       </div>

       <div class="checklist-section ion-padding">
         <div class="section-header">
           <h3>{{ t('tools.daily_checklist') }}</h3>
           <ion-button fill="clear" size="small" @click="resetDaily">
            <ion-icon :icon="refresh"></ion-icon>
          </ion-button>
         </div>
         <div class="checklist-container">
           <div 
             v-for="item in checklist" 
             :key="item.id" 
             class="checklist-item"
             :class="{ completed: item.checked }"
             @click="toggleItem(item)"
           >
             <div class="checkbox-wrapper">
               <div class="custom-checkbox" :class="{ checked: item.checked }">
                 <ion-icon v-if="item.checked" :icon="checkmark" class="check-icon"></ion-icon>
               </div>
             </div>
             <div class="item-content">
               <div class="item-label">{{ item.label }}</div>
               <div class="item-description">{{ item.description }}</div>
             </div>
             <div class="item-icon">
               <ion-icon :icon="item.icon"></ion-icon>
             </div>
           </div>
         </div>
       </div>

       <div class="history-section ion-padding" v-if="recentHistory.length > 0">
         <div class="section-header">
           <h3>{{ t('tools.recent_activity') }}</h3>
           <ion-button fill="clear" size="small" @click="resetRecentActivity">
             {{ t('tools.reset_activity') }}
           </ion-button>
         </div>
         <div class="history-list">
           <div v-for="(day, index) in recentHistory" :key="index" class="history-item">
             <div class="history-date-group">
               <div class="history-date">{{ formatDate(day.date) }}</div>
               <div class="history-activities">{{ getCompletedActivitiesText(day) }}</div>
             </div>
             <div class="history-progress">
               <div class="progress-bar">
                 <div class="progress-fill" :style="{ width: `${(day.completed/day.total) * 100}%` }"></div>
               </div>
               <span class="progress-text">{{ day.completed }}/{{ day.total }}</span>
             </div>
           </div>
         </div>
       </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonButton, IonIcon, onIonViewWillEnter } from '@ionic/vue';
import { computed, ref } from 'vue';
import { StorageService } from '@/shared/services/storage';
import { checkmark, refresh } from 'ionicons/icons';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const STORAGE_KEY = 'ramadan_checklist';
const STORAGE_KEY_HISTORY = 'ramadan_history';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  icon: string;
}

interface HistoryDay {
  date: string;
  completed: number;
  total: number;
  completedItemIds?: string[];
}

const checklist = ref<ChecklistItem[]>([
  { id: 'fasting', label: t('tools.fasting'), description: t('tools.fasting_description'), checked: false, icon: '🌙' },
  { id: 'prayers', label: t('tools.prayers'), description: t('tools.prayers_description'), checked: false, icon: '🕌' },
  { id: 'tarawih', label: t('tools.tarawih'), description: t('tools.tarawih_description'), checked: false, icon: '🌟' },
  { id: 'quran', label: t('tools.quran'), description: t('tools.quran_description'), checked: false, icon: '📖' },
]);

const streakDays = ref(0);
const totalCompleted = ref(0);
const recentHistory = ref<HistoryDay[]>([]);

const daysLeft = computed(() => {
  const ramadanStart = new Date('2026-02-18'); 
  const now = new Date();
  const diffTime = ramadanStart.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

const completedTasks = computed(() => {
  return checklist.value.filter(item => item.checked).length;
});

const totalTasks = computed(() => {
  return checklist.value.length;
});

const progressAngle = computed(() => {
  return (completedTasks.value / totalTasks.value) * 360;
});

const toggleItem = async (item: ChecklistItem) => {
  item.checked = !item.checked;
  await saveChecklist();
  await updateHistory();
};

const resetDaily = async () => {
  checklist.value.forEach(item => item.checked = false);
  await saveChecklist();
};

const resetRecentActivity = async () => {
  await StorageService.set(STORAGE_KEY_HISTORY, []);
  recentHistory.value = [];
  streakDays.value = 0;
  totalCompleted.value = 0;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

const loadChecklist = async () => {
  const savedData = await StorageService.get<{ date: string, items: ChecklistItem[] }>(STORAGE_KEY);
  const today = new Date().toISOString().split('T')[0];

  if (savedData) {
    if (savedData.date === today) {
      // Map saved items to our reactive ref
      savedData.items.forEach(savedItem => {
        const item = checklist.value.find(i => i.id === savedItem.id);
        if (item) item.checked = savedItem.checked;
      });
    } else {
      // Different day, reset checklist and save new date
      checklist.value.forEach(item => item.checked = false);
      await saveChecklist();
    }
  } else {
    // First time, save initial state
    await saveChecklist();
  }

  await loadHistory();
};

const saveChecklist = async () => {
  const today = new Date().toISOString().split('T')[0];
  await StorageService.set(STORAGE_KEY, {
    date: today,
    items: checklist.value.map(item => ({ 
      id: item.id, 
      checked: item.checked,
      label: item.label,
      description: item.description,
      icon: item.icon
    }))
  });
};

const loadHistory = async () => {
  const history = await StorageService.get<HistoryDay[]>(STORAGE_KEY_HISTORY) || [];
  recentHistory.value = history.slice(-7); // Show last 7 days
  
  // Calculate stats
  streakDays.value = calculateStreak(history);
  totalCompleted.value = history.reduce((sum, day) => sum + day.completed, 0);
};

const updateHistory = async () => {
  const today = new Date().toISOString().split('T')[0];
  const history = await StorageService.get<HistoryDay[]>(STORAGE_KEY_HISTORY) || [];
  const completedItemIds = checklist.value.filter(item => item.checked).map(item => item.id);
  
  const todayIndex = history.findIndex(day => day.date === today);
  const todayData = {
    date: today,
    completed: completedTasks.value,
    total: totalTasks.value,
    completedItemIds
  };

  if (todayIndex >= 0) {
    history[todayIndex] = todayData;
  } else {
    history.push(todayData);
  }

  // Keep only last 30 days
  const filteredHistory = history.slice(-30);
  await StorageService.set(STORAGE_KEY_HISTORY, filteredHistory);
  
  recentHistory.value = filteredHistory.slice(-7);
  streakDays.value = calculateStreak(filteredHistory);
  totalCompleted.value = filteredHistory.reduce((sum, day) => sum + day.completed, 0);
};

const getCompletedActivitiesText = (day: HistoryDay): string => {
  if (!day.completedItemIds || day.completedItemIds.length === 0) {
    return t('tools.no_activity_detail');
  }

  const labelById = new Map(checklist.value.map(item => [item.id, item.label]));
  return day.completedItemIds
    .map(id => labelById.get(id))
    .filter((label): label is string => Boolean(label))
    .join(', ');
};

const calculateStreak = (history: HistoryDay[]): number => {
  if (history.length === 0) return 0;
  
  // Sort by date descending
  const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  
  for (const day of sorted) {
    if (day.completed === day.total) {
      streak++;
    } else {
      break;
    }
    if (day.date === today) continue;
  }
  
  return streak;
};

onIonViewWillEnter(() => {
  loadChecklist();
});
</script>

<style scoped>
.ramadan-hero {
  background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-secondary) 100%);
  color: var(--ion-color-primary-contrast);
  padding: 40px 20px;
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
  box-shadow: 0 4px 15px rgba(var(--ion-color-primary-rgb), 0.2);
}

.ramadan-hero h1 {
  font-size: 1.4rem;
  font-weight: 500;
  opacity: 0.9;
  margin-bottom: 20px;
}

.countdown-box h2 {
  font-size: 5rem;
  font-weight: 800;
  margin: 0;
  line-height: 1;
}

.countdown-box p {
  font-size: 1.1rem;
  opacity: 0.8;
  margin-top: 10px;
}

.progress-ring {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}

.progress-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.progress-inner {
  width: 90px;
  height: 90px;
  background: var(--ion-card-background);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.progress-text {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--ion-color-primary);
}

.progress-label {
  font-size: 0.7rem;
  color: var(--ion-color-medium);
  margin-top: 2px;
}

.stats-section {
  padding: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.stat-card {
  background: var(--ion-card-background);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.stat-number {
  font-size: 2rem;
  font-weight: 800;
  color: var(--ion-color-primary);
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--ion-color-medium);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--ion-color-dark);
}

.checklist-container {
  background: var(--ion-card-background);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.checklist-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--ion-border-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.checklist-item:last-child {
  border-bottom: none;
}

.checklist-item:hover {
  background: var(--ion-color-step-100);
}

.checklist-item.completed {
  opacity: 0.7;
}

.checklist-item.completed .item-label {
  text-decoration: line-through;
  color: var(--ion-color-medium);
}

.checkbox-wrapper {
  margin-right: 16px;
}

.custom-checkbox {
  width: 24px;
  height: 24px;
  border: 2px solid var(--ion-color-medium);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.custom-checkbox.checked {
  background: var(--ion-color-primary);
  border-color: var(--ion-color-primary);
}

.check-icon {
  color: white;
  font-size: 16px;
}

.item-content {
  flex: 1;
}

.item-label {
  font-weight: 500;
  color: var(--ion-color-dark);
  margin-bottom: 4px;
}

.item-description {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}

.item-icon {
  margin-left: 16px;
  font-size: 1.2rem;
}

.history-section {
  padding: 20px;
}

.history-section h3 {
  margin-bottom: 16px;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--ion-text-color);
}

.history-list {
  background: var(--ion-card-background);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.history-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  gap: 12px;
}

.history-item:last-child {
  border-bottom: none;
}

.history-date {
  font-weight: 500;
  color: var(--ion-text-color);
  min-width: 60px;
}

.history-date-group {
  min-width: 120px;
}

.history-activities {
  margin-top: 6px;
  font-size: 0.78rem;
  color: var(--ion-color-medium);
  line-height: 1.3;
}

.history-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  margin-left: 16px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--ion-color-light);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--ion-color-primary);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.85rem;
  color: var(--ion-text-color);
  text-align: right;
}


</style>
